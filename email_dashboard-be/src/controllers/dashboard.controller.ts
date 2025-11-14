import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';
import { googleAuthService } from '../services/googleAuth.service';
import { ldapSyncService } from '../services/ldapSync.service';
import logger from '../config/logger';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard data endpoints
 */
class DashboardController {
  /**
   * Get Dashboard 1 (Response Dashboard) data
   * GET /api/dashboard/response
   * Filters data based on user role and manager relationships
   */
  async getDashboard1(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/response - Fetching dashboard 1 data');
      
      const allData = await dashboardService.getDashboard1Data();
      
      // Filter data based on user role and manager relationships
      const filteredData = await this.filterDashboardDataByUserRole(req, allData);

      res.status(200).json({
        success: true,
        message: 'Dashboard 1 data retrieved successfully',
        data: filteredData,
        count: filteredData.length,
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
   * Filters data based on user role and manager relationships
   */
  async getDashboard2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/aging - Fetching dashboard 2 data');
      
      const allData = await dashboardService.getDashboard2Data();
      
      // Filter data based on user role and manager relationships
      const filteredData = await this.filterDashboardDataByUserRole(req, allData);

      res.status(200).json({
        success: true,
        message: 'Dashboard 2 data retrieved successfully',
        data: filteredData,
        count: filteredData.length,
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
   * Get Dashboard 3 (Sentiment Dashboard) data
   * GET /api/dashboard/sentiment
   */
  async getDashboard3(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('GET /api/dashboard/sentiment - Fetching dashboard 3 data');
      
      const data = await dashboardService.getDashboard3Data();

      res.status(200).json({
        success: true,
        message: 'Dashboard 3 data retrieved successfully',
        data: data,
        cached: true,
      });
    } catch (error) {
      logger.error('Error in getDashboard3 controller:', error);
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

  /**
   * Filter dashboard data based on user role and manager relationships
   * @param {Request} req - Express request object with user info
   * @param {any[]} allData - All dashboard data
   * @returns {Promise<any[]>} Filtered dashboard data
   */
  private async filterDashboardDataByUserRole(req: Request, allData: any[]): Promise<any[]> {
    if (!req.user) {
      logger.warn('No user in request, returning empty data');
      return [];
    }

    const userRole = req.user.role;
    const userEmail = req.user.email;
    const userId = req.user.userId;

    // Super admin users see all data
    if (userRole === 'super admin') {
      logger.info(`${userRole} user ${userEmail} - returning all data`);
      return allData;
    }

    // Admin users see only data from their domain
    if (userRole === 'admin') {
      const adminDomain = userEmail.split('@')[1]?.toLowerCase();
      logger.info(`Admin user ${userEmail} - filtering for domain: ${adminDomain}`);
      
      const filteredData = allData.filter(item => {
        const itemEmail = (item.user_email || item.email || '').toLowerCase();
        const itemDomain = itemEmail.split('@')[1]?.toLowerCase();
        return itemDomain === adminDomain;
      });
      
      logger.info(`Admin user ${userEmail} - filtered to ${filteredData.length} records from domain ${adminDomain}`);
      return filteredData;
    }

    // Manager users see their own data + subordinates' data
    if (userRole === 'manager') {
      logger.info(`Manager user ${userEmail} - filtering for manager and subordinates`);
    }

    // Check if user is Google or LDAP
    const isGoogleUser = typeof userId === 'string' && userId.startsWith('google_');
    const isLdapUser = typeof userId === 'string' && userId.startsWith('ldap_');

    let subordinateEmails: string[] = [];

    try {
      if (isGoogleUser) {
        // Get Google user info
        const googleId = userId.replace('google_', '');
        const googleUser = await googleAuthService.getUserByGoogleId(googleId);
        
        if (googleUser) {
          // Check if this user has managers assigned (meaning they are a manager)
          // Find all users who have this user as their manager
          const allGoogleUsers = await googleAuthService.getAllUsers();
          subordinateEmails = allGoogleUsers
            .filter(u => {
              if (!u.manager) return false;
              const managers = Array.isArray(u.manager) ? u.manager : [u.manager];
              return managers.some(m => m.userId === googleId || m.email === userEmail);
            })
            .map(u => u.email);
        }
      } else if (isLdapUser) {
        // Get LDAP user info
        const sAMAccountName = userId.replace('ldap_', '');
        const allLdapUsers = await ldapSyncService.getSyncedUsers();
        const ldapUser = allLdapUsers.find(u => u.sAMAccountName.toLowerCase() === sAMAccountName.toLowerCase());
        
        if (ldapUser) {
          // Find all users who have this user as their manager
          subordinateEmails = allLdapUsers
            .filter(u => {
              if (!u.manager) return false;
              const managers = Array.isArray(u.manager) ? u.manager : [u.manager];
              return managers.some(m => m.userId === sAMAccountName || m.email === userEmail);
            })
            .map(u => u.userPrincipalName || u.mail || '');
        }
      }
    } catch (error) {
      logger.error('Error fetching user manager info:', error);
      // Continue with just user's own data if manager lookup fails
    }

    // Filter dashboard data
    // Regular users (role: "user") see only their own data
    // Manager users see their own data + subordinates' data
    const allowedEmails = new Set([userEmail.toLowerCase()]);
    
    // Add subordinate emails (for managers)
    if (userRole === 'manager') {
      subordinateEmails.forEach(email => {
        if (email) {
          allowedEmails.add(email.toLowerCase());
        }
      });
    }

    const filteredData = allData.filter(item => {
      const itemEmail = (item.user_email || item.email || '').toLowerCase();
      return allowedEmails.has(itemEmail);
    });

    logger.info(`User ${userEmail} (role: ${userRole}) - filtered to ${filteredData.length} records${userRole === 'manager' ? ` (${subordinateEmails.length} subordinates)` : ''}`);
    
    return filteredData;
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;

