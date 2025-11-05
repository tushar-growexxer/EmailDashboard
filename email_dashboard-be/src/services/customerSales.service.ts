import db from '../config/database';
import cacheService from './cache.service';
import logger from '../config/logger';

/**
 * Customer Sales Service
 * Handles customer sales data from HANA with caching
 */
class CustomerSalesService {
  private readonly CUSTOMER_SALES_CACHE_KEY = 'customer_sales_data';
  private readonly schema = db.getConfig().schema;

  /**
   * Get customer sales data from HANA
   * Returns cached data if available, otherwise fetches from HANA
   * @returns {Promise<any[]>} Customer sales data
   */
  async getCustomerSalesData(): Promise<any[]> {
    try {
      // Check cache first
      const cachedData = cacheService.get<any[]>(this.CUSTOMER_SALES_CACHE_KEY);
      if (cachedData) {
        logger.info('Customer sales data retrieved from cache');
        return cachedData;
      }

      // Fetch from HANA
      logger.info('Fetching customer sales data from HANA...');

      const query = `
        WITH sales AS (
          SELECT 
            T0."CardCode",
            SUM(T1."Quantity") AS "Total Quantity",
            SUM(T0."DocTotal") AS "Total Value"
          FROM ${this.schema}.OINV T0
          JOIN ${this.schema}.INV1 T1 ON T0."DocEntry" = T1."DocEntry"
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
          FROM ${this.schema}.OCPR T1
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
        FROM ${this.schema}.OCRD T0
        LEFT JOIN emails e ON T0."CardCode" = e."CardCode"
        LEFT JOIN sales s ON s."CardCode" = T0."CardCode"
        WHERE T0."validFor" = 'Y' 
          AND T0."CardCode" LIKE 'C%' 
          AND e."Email" IS NOT NULL
        ORDER BY T0."CardCode"
      `;

      const data = await db.query(query);

      // Cache the data
      if (data && data.length > 0) {
        cacheService.set(this.CUSTOMER_SALES_CACHE_KEY, data);
        logger.info(`Customer sales data fetched and cached (${data.length} records)`);
      } else {
        logger.warn('Customer sales query returned no data');
      }

      return data;
    } catch (error) {
      logger.error('Error fetching customer sales data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch customer sales data';
      throw new Error(errorMessage);
    }
  }

  /**
   * Search customers by name
   * @param {string} searchTerm - Search term for customer name
   * @param {number} limit - Maximum number of results (default: 10)
   * @returns {Promise<any[]>} Matching customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<any[]> {
    try {
      const allCustomers = await this.getCustomerSalesData();

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
   * @returns {Promise<any | null>} Customer data or null
   */
  async getCustomerByCardCode(cardCode: string): Promise<any | null> {
    try {
      const allCustomers = await this.getCustomerSalesData();
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
