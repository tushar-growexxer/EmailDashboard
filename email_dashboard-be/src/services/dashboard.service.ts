import mongodb from '../config/mongodb';
import cacheService from './cache.service';
import logger from '../config/logger';

/**
 * Dashboard Service for MongoDB operations
 * Handles data fetching from MongoDB with caching
 */
class DashboardService {
  private readonly DASHBOARD1_CACHE_KEY = 'dashboard1_data';
  private readonly DASHBOARD2_CACHE_KEY = 'dashboard2_data';
  private readonly DASHBOARD3_DAILY_CACHE_KEY = 'dashboard3_daily_data';
  private readonly DASHBOARD3_WEEKLY_CACHE_KEY = 'dashboard3_weekly_data';
  private readonly DASHBOARD3_USER_DOMAIN_CACHE_KEY = 'dashboard3_user_domain_data';

  /**
   * Get Dashboard 1 (Response Dashboard) data
   * Returns cached data if available, otherwise fetches from MongoDB
   * @returns {Promise<any[]>} Dashboard 1 data
   */
  async getDashboard1Data(): Promise<any[]> {
    try {
      // Check cache first
      const cachedData = cacheService.get<any[]>(this.DASHBOARD1_CACHE_KEY);
      if (cachedData) {
        logger.info('Dashboard 1 data retrieved from cache');
        return cachedData;
      }

      // Check if MongoDB is connected
      if (!mongodb.isConnected()) {
        logger.warn('MongoDB not connected, attempting to connect...');
        try {
          await mongodb.connect();
        } catch (connectError) {
          logger.error('Failed to connect to MongoDB:', connectError);
          throw new Error('MongoDB connection unavailable. Please check database configuration.');
        }
      }

      // Fetch from MongoDB
      logger.info('Fetching Dashboard 1 data from MongoDB...');
      const collection = await mongodb.getDashboard1Collection();
      const data = await collection.find({}).toArray();

      // Cache the data
      if (data && data.length > 0) {
        cacheService.set(this.DASHBOARD1_CACHE_KEY, data);
        logger.info(`Dashboard 1 data fetched and cached (${data.length} documents)`);
      } else {
        logger.warn('Dashboard 1 collection is empty');
      }

      return data;
    } catch (error) {
      logger.error('Error fetching Dashboard 1 data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch Dashboard 1 data';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Dashboard 2 (Aging Dashboard) data
   * Returns cached data if available, otherwise fetches from MongoDB
   * @returns {Promise<any[]>} Dashboard 2 data
   */
  async getDashboard2Data(): Promise<any[]> {
    try {
      // Check cache first
      const cachedData = cacheService.get<any[]>(this.DASHBOARD2_CACHE_KEY);
      if (cachedData) {
        logger.info('Dashboard 2 data retrieved from cache');
        return cachedData;
      }

      // Check if MongoDB is connected
      if (!mongodb.isConnected()) {
        logger.warn('MongoDB not connected, attempting to connect...');
        try {
          await mongodb.connect();
        } catch (connectError) {
          logger.error('Failed to connect to MongoDB:', connectError);
          throw new Error('MongoDB connection unavailable. Please check database configuration.');
        }
      }

      // Fetch from MongoDB
      logger.info('Fetching Dashboard 2 data from MongoDB...');
      const collection = await mongodb.getDashboard2Collection();
      const data = await collection.find({}).toArray();

      // Cache the data
      if (data && data.length > 0) {
        cacheService.set(this.DASHBOARD2_CACHE_KEY, data);
        logger.info(`Dashboard 2 data fetched and cached (${data.length} documents)`);
      } else {
        logger.warn('Dashboard 2 collection is empty');
      }

      return data;
    } catch (error) {
      logger.error('Error fetching Dashboard 2 data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch Dashboard 2 data';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Dashboard 1 data for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<any | null>} User's dashboard data or null
   */
  async getDashboard1DataByUser(userId: number): Promise<any | null> {
    try {
      const allData = await this.getDashboard1Data();
      const userData = allData.find((item) => item.user_id === userId);

      if (!userData) {
        logger.warn(`No Dashboard 1 data found for user ID: ${userId}`);
        return null;
      }

      return userData;
    } catch (error) {
      logger.error(`Error fetching Dashboard 1 data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get Dashboard 2 data for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<any | null>} User's dashboard data or null
   */
  async getDashboard2DataByUser(userId: number): Promise<any | null> {
    try {
      const allData = await this.getDashboard2Data();
      const userData = allData.find((item) => item.user_id === userId);

      if (!userData) {
        logger.warn(`No Dashboard 2 data found for user ID: ${userId}`);
        return null;
      }

      return userData;
    } catch (error) {
      logger.error(`Error fetching Dashboard 2 data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get Dashboard 3 Daily Aggregates data
   * Returns cached data if available, otherwise fetches from MongoDB
   * @returns {Promise<any>} Dashboard 3 daily data
   */
  async getDashboard3DailyData(): Promise<any> {
    try {
      const cachedData = cacheService.get<any>(this.DASHBOARD3_DAILY_CACHE_KEY);
      if (cachedData) {
        logger.info('Dashboard 3 daily data retrieved from cache');
        return cachedData;
      }

      if (!mongodb.isConnected()) {
        await mongodb.connect();
      }

      logger.info('Fetching Dashboard 3 daily data from MongoDB...');
      const db = await mongodb.getDatabase();
      const collection = db.collection('dashboard3_daily_aggregates');
      const data = await collection.findOne({});

      if (data) {
        // Return only the domains array, not the whole document with _id
        const result = { domains: data.domains || [] };
        cacheService.set(this.DASHBOARD3_DAILY_CACHE_KEY, result);
        logger.info(`Dashboard 3 daily data fetched and cached (${result.domains.length} domains)`);
        return result;
      }

      return { domains: [] };
    } catch (error) {
      logger.error('Error fetching Dashboard 3 daily data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch Dashboard 3 daily data'
      );
    }
  }

  /**
   * Get Dashboard 3 Weekly Aggregates data
   * Returns cached data if available, otherwise fetches from MongoDB
   * @returns {Promise<any>} Dashboard 3 weekly data
   */
  async getDashboard3WeeklyData(): Promise<any> {
    try {
      const cachedData = cacheService.get<any>(this.DASHBOARD3_WEEKLY_CACHE_KEY);
      if (cachedData) {
        logger.info('Dashboard 3 weekly data retrieved from cache');
        return cachedData;
      }

      if (!mongodb.isConnected()) {
        await mongodb.connect();
      }

      logger.info('Fetching Dashboard 3 weekly data from MongoDB...');
      const db = await mongodb.getDatabase();
      const collection = db.collection('dashboard3_weekly_aggregates');
      const data = await collection.findOne({});

      if (data) {
        // Return only the domains array, not the whole document with _id
        const result = { domains: data.domains || [] };
        cacheService.set(this.DASHBOARD3_WEEKLY_CACHE_KEY, result);
        logger.info(
          `Dashboard 3 weekly data fetched and cached (${result.domains.length} domains)`
        );
        return result;
      }

      return { domains: [] };
    } catch (error) {
      logger.error('Error fetching Dashboard 3 weekly data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch Dashboard 3 weekly data'
      );
    }
  }

  /**
   * Get Dashboard 3 User Domain Scores data
   * Returns cached data if available, otherwise fetches from MongoDB
   * @returns {Promise<any>} Dashboard 3 user domain data
   */
  async getDashboard3UserDomainData(): Promise<any> {
    try {
      const cachedData = cacheService.get<any>(this.DASHBOARD3_USER_DOMAIN_CACHE_KEY);
      if (cachedData) {
        logger.info('Dashboard 3 user domain data retrieved from cache');
        return cachedData;
      }

      if (!mongodb.isConnected()) {
        await mongodb.connect();
      }

      logger.info('Fetching Dashboard 3 user domain data from MongoDB...');
      const db = await mongodb.getDatabase();
      const collection = db.collection('dashboard3_user_domain_scores');
      const data = await collection.findOne({});

      if (data) {
        // Return only the domains array, not the whole document with _id
        const result = { domains: data.domains || [] };
        cacheService.set(this.DASHBOARD3_USER_DOMAIN_CACHE_KEY, result);
        logger.info(
          `Dashboard 3 user domain data fetched and cached (${result.domains.length} domains)`
        );
        return result;
      }

      return { domains: [] };
    } catch (error) {
      logger.error('Error fetching Dashboard 3 user domain data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch Dashboard 3 user domain data'
      );
    }
  }

  /**
   * Get all Dashboard 3 data (daily, weekly, user domain)
   * @returns {Promise<any>} All Dashboard 3 data
   */
  async getDashboard3Data(): Promise<any> {
    try {
      const [daily, weekly, userDomain] = await Promise.all([
        this.getDashboard3DailyData(),
        this.getDashboard3WeeklyData(),
        this.getDashboard3UserDomainData(),
      ]);

      return {
        daily,
        weekly,
        userDomain,
      };
    } catch (error) {
      logger.error('Error fetching Dashboard 3 data:', error);
      throw error;
    }
  }

  /**
   * Refresh cache for all dashboards
   * Manually clears cache and fetches fresh data from MongoDB
   * @returns {Promise<void>}
   */
  async refreshCache(): Promise<void> {
    try {
      logger.info('Manually refreshing dashboard cache...');

      // Clear existing cache
      cacheService.delete(this.DASHBOARD1_CACHE_KEY);
      cacheService.delete(this.DASHBOARD2_CACHE_KEY);
      cacheService.delete(this.DASHBOARD3_DAILY_CACHE_KEY);
      cacheService.delete(this.DASHBOARD3_WEEKLY_CACHE_KEY);
      cacheService.delete(this.DASHBOARD3_USER_DOMAIN_CACHE_KEY);

      // Fetch fresh data (will automatically cache)
      await Promise.all([
        this.getDashboard1Data(),
        this.getDashboard2Data(),
        this.getDashboard3Data(),
      ]);

      logger.info('Dashboard cache refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing dashboard cache:', error);
      throw error;
    }
  }

  /**
   * Get cache status for dashboards
   * @returns {Object} Cache status information
   */
  getCacheStatus() {
    return {
      dashboard1: {
        cached: cacheService.has(this.DASHBOARD1_CACHE_KEY),
        key: this.DASHBOARD1_CACHE_KEY,
      },
      dashboard2: {
        cached: cacheService.has(this.DASHBOARD2_CACHE_KEY),
        key: this.DASHBOARD2_CACHE_KEY,
      },
      dashboard3: {
        daily: {
          cached: cacheService.has(this.DASHBOARD3_DAILY_CACHE_KEY),
          key: this.DASHBOARD3_DAILY_CACHE_KEY,
        },
        weekly: {
          cached: cacheService.has(this.DASHBOARD3_WEEKLY_CACHE_KEY),
          key: this.DASHBOARD3_WEEKLY_CACHE_KEY,
        },
        userDomain: {
          cached: cacheService.has(this.DASHBOARD3_USER_DOMAIN_CACHE_KEY),
          key: this.DASHBOARD3_USER_DOMAIN_CACHE_KEY,
        },
      },
      stats: cacheService.getStats(),
      config: cacheService.getConfig(),
    };
  }

  /**
   * Test MongoDB connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await mongodb.connect();
      return mongodb.isConnected();
    } catch (error) {
      logger.error('MongoDB connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
