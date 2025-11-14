import { Request, Response, NextFunction } from 'express';
import customerSalesService from '../services/customerSales.service';
import logger from '../config/logger';

/**
 * Customer Sales Controller
 * Handles HTTP requests for customer sales data endpoints
 */
class CustomerSalesController {
  /**
   * Get all customer sales data
   * GET /api/customers/sales
   */
  async getAllCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = req.user?.email;
      logger.info(`[CUSTOMER-SALES] ========== Get All Customers Request ==========`);
      logger.info(`[CUSTOMER-SALES] User: ${userEmail || 'unknown'}`);
      logger.info(`[CUSTOMER-SALES] User ID: ${req.user?.userId}`);
      logger.info(`[CUSTOMER-SALES] User Role: ${req.user?.role}`);
      
      logger.info(`[CUSTOMER-SALES] Calling service layer...`);
      const data = await customerSalesService.getCustomerSalesData(userEmail);
      logger.info(`[CUSTOMER-SALES] Service returned ${data.length} customers`);

      res.status(200).json({
        success: true,
        message: 'Customer sales data retrieved successfully',
        data: data,
        count: data.length,
      });
      logger.info(`[CUSTOMER-SALES] Response sent successfully`);
    } catch (error) {
      logger.error('[CUSTOMER-SALES] ========== Error in getAllCustomers ==========');
      logger.error('[CUSTOMER-SALES] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[CUSTOMER-SALES] Error message: ${error.message}`);
        logger.error(`[CUSTOMER-SALES] Error stack: ${error.stack}`);
      }
      next(error);
    }
  }

  /**
   * Search customers by name
   * GET /api/customers/search?q=searchTerm&limit=10
   */
  async searchCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchTerm = req.query.q as string || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const userEmail = req.user?.email;

      logger.info(`[CUSTOMER-SEARCH] ========== Search Customers Request ==========`);
      logger.info(`[CUSTOMER-SEARCH] User: ${userEmail || 'unknown'}`);
      logger.info(`[CUSTOMER-SEARCH] Search term: "${searchTerm}"`);
      logger.info(`[CUSTOMER-SEARCH] Limit: ${limit}`);

      logger.info(`[CUSTOMER-SEARCH] Calling service layer...`);
      const results = await customerSalesService.searchCustomers(searchTerm, limit, userEmail);
      logger.info(`[CUSTOMER-SEARCH] Service returned ${results.length} results`);

      res.status(200).json({
        success: true,
        message: 'Customer search completed successfully',
        data: results,
        count: results.length,
        searchTerm: searchTerm,
      });
      logger.info(`[CUSTOMER-SEARCH] Response sent successfully`);
    } catch (error) {
      logger.error('[CUSTOMER-SEARCH] ========== Error in searchCustomers ==========');
      logger.error('[CUSTOMER-SEARCH] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[CUSTOMER-SEARCH] Error message: ${error.message}`);
        logger.error(`[CUSTOMER-SEARCH] Error stack: ${error.stack}`);
      }
      next(error);
    }
  }

  /**
   * Get customer by CardCode
   * GET /api/customers/:cardCode
   */
  async getCustomerByCardCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardCode = req.params.cardCode;
      const userEmail = req.user?.email;

      logger.info(`GET /api/customers/${cardCode} - Fetching customer data${userEmail ? ` for user: ${userEmail}` : ''}`);

      const customer = await customerSalesService.getCustomerByCardCode(cardCode, userEmail);

      if (!customer) {
        res.status(404).json({
          success: false,
          message: `Customer not found with CardCode: ${cardCode}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer data retrieved successfully',
        data: customer,
      });
    } catch (error) {
      logger.error('Error in getCustomerByCardCode controller:', error);
      next(error);
    }
  }

  /**
   * Refresh customer sales cache manually
   * POST /api/customers/refresh-cache
   */
  async refreshCache(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('POST /api/customers/refresh-cache - Manual cache refresh requested');

      await customerSalesService.refreshCache();

      res.status(200).json({
        success: true,
        message: 'Customer sales cache refreshed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in refreshCache controller:', error);
      next(error);
    }
  }

  /**
   * Get cache status
   * GET /api/customers/cache-status
   */
  async getCacheStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/customers/cache-status - Fetching cache status');

      const status = customerSalesService.getCacheStatus();

      res.status(200).json({
        success: true,
        message: 'Cache status retrieved successfully',
        status: status,
      });
    } catch (error) {
      logger.error('Error in getCacheStatus controller:', error);
      next(error);
    }
  }
}

export const customerSalesController = new CustomerSalesController();
export default customerSalesController;
