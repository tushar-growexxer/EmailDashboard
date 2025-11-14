import db from '../config/database';
import cacheService from './cache.service';
import logger from '../config/logger';
import { allowedDomainModel } from '../models/AllowedDomain';

/**
 * Customer Sales Service
 * Handles customer sales data from HANA with caching
 */
class CustomerSalesService {
  private readonly CUSTOMER_SALES_CACHE_KEY = 'customer_sales_data';
  // NOTE: No default schema - each domain must have its own database configured

  /**
   * Get database schema for a given domain
   * @param {string} domain - Domain name (e.g., 'example.com')
   * @returns {Promise<string | null>} Database schema name or null if not configured
   */
  private async getSchemaForDomain(domain: string): Promise<string | null> {
    try {
      logger.info(`[SCHEMA-LOOKUP] ========== Schema Lookup ==========`);
      logger.info(`[SCHEMA-LOOKUP] Input domain: ${domain}`);
      
      if (!domain) {
        logger.warn('[SCHEMA-LOOKUP] No domain provided, cannot determine schema');
        return null;
      }

      const normalizedDomain = domain.toLowerCase().trim().replace(/^www\./, '');
      logger.info(`[SCHEMA-LOOKUP] Normalized domain: ${normalizedDomain}`);
      logger.info(`[SCHEMA-LOOKUP] Querying allowed domains table...`);
      
      const domainRecord = await allowedDomainModel.findByDomain(normalizedDomain);
      logger.info(`[SCHEMA-LOOKUP] Domain record found: ${!!domainRecord}`);
      
      if (domainRecord?.database) {
        logger.info(`[SCHEMA-LOOKUP] ✓ Database schema: "${domainRecord.database}"`);
        logger.info(`[SCHEMA-LOOKUP] Domain is allowed: true`);
        return domainRecord.database;
      }

      logger.info(`[SCHEMA-LOOKUP] ✗ No database configured for domain "${normalizedDomain}"`);
      return null;
    } catch (error) {
      logger.error(`[SCHEMA-LOOKUP] ========== Error in Schema Lookup ==========`);
      logger.error(`[SCHEMA-LOOKUP] Domain: "${domain}"`);
      logger.error(`[SCHEMA-LOOKUP] Error details:`, error);
      if (error instanceof Error) {
        logger.error(`[SCHEMA-LOOKUP] Error message: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Get customer sales data from HANA
   * Returns cached data if available, otherwise fetches from HANA
   * @param {string} userEmail - User's email address to determine domain and database (optional)
   * @returns {Promise<any[]>} Customer sales data
   */
  async getCustomerSalesData(userEmail?: string): Promise<any[]> {
    try {
      logger.info(`[CUSTOMER-SERVICE] ========== Get Customer Sales Data ==========`);
      logger.info(`[CUSTOMER-SERVICE] User email: ${userEmail || 'not provided'}`);
      
      // Determine schema based on user's domain
      let schema: string | null = null;
      if (userEmail) {
        const domain = userEmail.split('@')[1];
        logger.info(`[CUSTOMER-SERVICE] Extracted domain: ${domain}`);
        logger.info(`[CUSTOMER-SERVICE] Looking up database schema for domain...`);
        schema = await this.getSchemaForDomain(domain);
        logger.info(`[CUSTOMER-SERVICE] Schema lookup result: ${schema || 'not found'}`);
        
        // If no schema configured for this domain, return empty array
        if (!schema) {
          logger.info(`[CUSTOMER-SERVICE] No database configured for domain "${domain}", returning empty customer list`);
          return [];
        }
      } else {
        // If no user email provided, cannot determine schema
        logger.warn('[CUSTOMER-SERVICE] No user email provided, cannot determine database schema');
        return [];
      }

      // Use domain-specific cache key
      const cacheKey = `${this.CUSTOMER_SALES_CACHE_KEY}_${schema}`;
      logger.info(`[CUSTOMER-SERVICE] Cache key: ${cacheKey}`);

      // Check cache first
      logger.info(`[CUSTOMER-SERVICE] Checking cache...`);
      const cachedData = cacheService.get<any[]>(cacheKey);
      if (cachedData) {
        logger.info(`[CUSTOMER-SERVICE] ✓ Cache HIT - returning ${cachedData.length} records from cache`);
        return cachedData;
      }
      logger.info(`[CUSTOMER-SERVICE] ✗ Cache MISS - fetching from database`);

      // Fetch from HANA
      logger.info(`[CUSTOMER-SERVICE] Connecting to SAP HANA database...`);
      logger.info(`[CUSTOMER-SERVICE] Schema: ${schema}`);
      logger.info(`[CUSTOMER-SERVICE] Preparing SQL query...`);

      const query = `
        WITH sales AS (
          SELECT 
            T0."CardCode",
            SUM(T1."Quantity") AS "Total Quantity",
            SUM(T0."DocTotal") AS "Total Value"
          FROM ${schema}.OINV T0
          JOIN ${schema}.INV1 T1 ON T0."DocEntry" = T1."DocEntry"
          WHERE T0."CANCELED" = 'N' 
            AND T0."CardCode" LIKE 'C%'
            AND T0."DocDate" >= ADD_YEARS(
              TO_DATE(TO_VARCHAR(EXTRACT(YEAR FROM CURRENT_DATE)) || '-04-01'),
              CASE WHEN MONTH(CURRENT_DATE) < 4 THEN -1 ELSE 0 END
            )
            AND T0."DocDate" < ADD_YEARS(
              TO_DATE(TO_VARCHAR(EXTRACT(YEAR FROM CURRENT_DATE)) || '-04-01'),
              CASE WHEN MONTH(CURRENT_DATE) < 4 THEN 0 ELSE 1 END
            )
          GROUP BY T0."CardCode"
        ),
        emails AS (
          SELECT 
            T1."CardCode",
            MIN(T1."E_MailL") AS "Email"
          FROM ${schema}.OCPR T1
          WHERE T1."E_MailL" IS NOT NULL
          GROUP BY T1."CardCode"
        )
        SELECT DISTINCT
          T0."CardCode",
          T0."CardName",
          CASE 
            WHEN T0."CardCode" LIKE 'C_D%' THEN 'Domestic'
            WHEN T0."CardCode" LIKE 'C_E%' THEN 'Export'
          END AS "Domestic/Export",
          e."Email",
          s."Total Quantity",
          s."Total Value"
        FROM ${schema}.OCRD T0
        LEFT JOIN emails e ON T0."CardCode" = e."CardCode"
        LEFT JOIN sales s ON s."CardCode" = T0."CardCode"
        WHERE T0."validFor" = 'Y' 
          AND T0."CardCode" LIKE 'C%' 
          AND e."Email" IS NOT NULL
        ORDER BY T0."CardCode"
      `;

      logger.info(`[CUSTOMER-SERVICE] Executing query on database...`);
      const startTime = Date.now();
      const data = await db.query(query);
      const duration = Date.now() - startTime;
      logger.info(`[CUSTOMER-SERVICE] Query executed in ${duration}ms`);
      logger.info(`[CUSTOMER-SERVICE] Query returned ${data?.length || 0} records`);

      // Cache the data
      if (data && data.length > 0) {
        logger.info(`[CUSTOMER-SERVICE] Caching ${data.length} records...`);
        cacheService.set(cacheKey, data);
        logger.info(`[CUSTOMER-SERVICE] ✓ Data cached successfully`);
      } else {
        logger.warn(`[CUSTOMER-SERVICE] ⚠ Query returned no data (schema: ${schema})`);
      }

      logger.info(`[CUSTOMER-SERVICE] ========== Operation Complete ==========`);
      return data;
    } catch (error) {
      logger.error('[CUSTOMER-SERVICE] ========== Error Fetching Customer Sales Data ==========');
      logger.error('[CUSTOMER-SERVICE] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[CUSTOMER-SERVICE] Error message: ${error.message}`);
        logger.error(`[CUSTOMER-SERVICE] Error stack: ${error.stack}`);
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch customer sales data';
      throw new Error(errorMessage);
    }
  }

  /**
   * Search customers by name
   * @param {string} searchTerm - Search term for customer name
   * @param {number} limit - Maximum number of results (default: 10)
   * @param {string} userEmail - User's email address to determine domain and database (optional)
   * @returns {Promise<any[]>} Matching customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10, userEmail?: string): Promise<any[]> {
    try {
      const allCustomers = await this.getCustomerSalesData(userEmail);

      if (!searchTerm || searchTerm.trim() === '') {
        return allCustomers.slice(0, limit);
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = allCustomers.filter(
        (customer) =>
          customer.CardName?.toLowerCase().includes(searchLower) ||
          customer.CardCode?.toLowerCase().includes(searchLower)
      );

      logger.info(`Customer search for "${searchTerm}" returned ${filtered.length} results`);
      return filtered.slice(0, limit);
    } catch (error) {
      logger.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by CardCode
   * @param {string} cardCode - Customer card code
   * @param {string} userEmail - User's email address to determine domain and database (optional)
   * @returns {Promise<any | null>} Customer data or null
   */
  async getCustomerByCardCode(cardCode: string, userEmail?: string): Promise<any | null> {
    try {
      const allCustomers = await this.getCustomerSalesData(userEmail);
      const customer = allCustomers.find((c) => c.CardCode === cardCode);

      if (!customer) {
        logger.warn(`No customer found with CardCode: ${cardCode}`);
        return null;
      }

      return customer;
    } catch (error) {
      logger.error(`Error fetching customer ${cardCode}:`, error);
      throw error;
    }
  }

  /**
   * Refresh cache manually
   * @returns {Promise<void>}
   */
  async refreshCache(): Promise<void> {
    try {
      logger.info('Manually refreshing customer sales cache...');

      // Clear existing cache
      cacheService.delete(this.CUSTOMER_SALES_CACHE_KEY);

      // Fetch fresh data (will automatically cache)
      await this.getCustomerSalesData();

      logger.info('Customer sales cache refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing customer sales cache:', error);
      throw error;
    }
  }

  /**
   * Get cache status
   * @returns {Object} Cache status information
   */
  getCacheStatus() {
    return {
      cached: cacheService.has(this.CUSTOMER_SALES_CACHE_KEY),
      key: this.CUSTOMER_SALES_CACHE_KEY,
    };
  }
}

// Export singleton instance
export const customerSalesService = new CustomerSalesService();
export default customerSalesService;
