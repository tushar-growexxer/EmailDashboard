import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';
import logger from '../config/logger';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard data endpoints
 */
class DashboardController {
  /**
   * Get Dashboard 1 (Response Dashboard) data
   * GET /api/dashboard/response
   */
  async getDashboard1(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/response - Fetching dashboard 1 data');
      
      const data = await dashboardService.getDashboard1Data();

      res.status(200).json({
        success: true,
        message: 'Dashboard 1 data retrieved successfully',
        data: data,
        count: data.length,
        cached: true, // Will be true if data came from cache
      });
    } catch (error) {
      logger.error('Error in getDashboard1 controller:', error);
      next(error);
    }
  }

  /**
   * Get Dashboard 2 (Aging Dashboard) data
   * GET /api/dashboard/aging
   */
  async getDashboard2(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/aging - Fetching dashboard 2 data');
      
      const data = await dashboardService.getDashboard2Data();

      res.status(200).json({
        success: true,
        message: 'Dashboard 2 data retrieved successfully',
        data: data,
        count: data.length,
        cached: true,
      });
    } catch (error) {
      logger.error('Error in getDashboard2 controller:', error);
      next(error);
    }
  }

  /**
   * Get Dashboard 1 data for specific user
   * GET /api/dashboard/response/user/:userId
   */
  async getDashboard1ByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      logger.info(`GET /api/dashboard/response/user/${userId} - Fetching user-specific data`);

      const data = await dashboardService.getDashboard1DataByUser(userId);

      if (!data) {
        res.status(404).json({
          success: false,
          message: `No dashboard data found for user ID: ${userId}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User dashboard data retrieved successfully',
        data: data,
      });
    } catch (error) {
      logger.error('Error in getDashboard1ByUser controller:', error);
      next(error);
    }
  }

  /**
   * Get Dashboard 2 data for specific user
   * GET /api/dashboard/aging/user/:userId
   */
  async getDashboard2ByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      logger.info(`GET /api/dashboard/aging/user/${userId} - Fetching user-specific data`);

      const data = await dashboardService.getDashboard2DataByUser(userId);

      if (!data) {
        res.status(404).json({
          success: false,
          message: `No dashboard data found for user ID: ${userId}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User dashboard data retrieved successfully',
        data: data,
      });
    } catch (error) {
      logger.error('Error in getDashboard2ByUser controller:', error);
      next(error);
    }
  }

  /**
   * Refresh cache manually (admin only)
   * POST /api/dashboard/refresh-cache
   */
  async refreshCache(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('POST /api/dashboard/refresh-cache - Manual cache refresh requested');

      await dashboardService.refreshCache();

      res.status(200).json({
        success: true,
        message: 'Cache refreshed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in refreshCache controller:', error);
      next(error);
    }
  }

  /**
   * Get cache status
   * GET /api/dashboard/cache-status
   */
  async getCacheStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/cache-status - Fetching cache status');

      const status = dashboardService.getCacheStatus();

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

  /**
   * Health check endpoint for MongoDB connection
   * GET /api/dashboard/health
   */
  async healthCheck(_req: Request, _res: Response): Promise<void> {
    try {
      logger.info('GET /api/dashboard/health - Health check requested');

      const isConnected = await dashboardService.testConnection();

      if (isConnected) {
        _res.status(200).json({
          success: true,
          message: 'MongoDB connection is healthy',
          status: 'connected',
          timestamp: new Date().toISOString(),
        });
      } else {
        _res.status(503).json({
          success: false,
          message: 'MongoDB connection failed',
          status: 'disconnected',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Error in healthCheck controller:', error);
      _res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: (error as Error).message,
      });
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;

