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
  async getAllCustomers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/customers/sales - Fetching all customer sales data');
      
      const data = await customerSalesService.getCustomerSalesData();

      res.status(200).json({
        success: true,
        message: 'Customer sales data retrieved successfully',
        data: data,
        count: data.length,
      });
    } catch (error) {
      logger.error('Error in getAllCustomers controller:', error);
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

      logger.info(`GET /api/customers/search - Searching for "${searchTerm}"`);

      const results = await customerSalesService.searchCustomers(searchTerm, limit);

      res.status(200).json({
        success: true,
        message: 'Customer search completed successfully',
        data: results,
        count: results.length,
        searchTerm: searchTerm,
      });
    } catch (error) {
      logger.error('Error in searchCustomers controller:', error);
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

      logger.info(`GET /api/customers/${cardCode} - Fetching customer data`);

      const customer = await customerSalesService.getCustomerByCardCode(cardCode);

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
