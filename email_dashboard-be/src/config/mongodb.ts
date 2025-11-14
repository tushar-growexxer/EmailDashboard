import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import logger from './logger';

/**
 * MongoDB configuration interface
 */
export interface MongoDBConfig {
  uri: string;
  database: string;
  dashboard1Collection: string;
  dashboard2Collection: string;
}

/**
 * Get MongoDB configuration from environment variables
 * @returns {MongoDBConfig} MongoDB configuration object
 */
export const getMongoDBConfig = (): MongoDBConfig => {
  // Support both MONGODB_URI and CONNECTION_STRING for backward compatibility
  const uri = process.env.MONGODB_URI || process.env.CONNECTION_STRING || 'mongodb://192.168.10.6:27017';

  return {
    uri: uri,
    database: process.env.ANALYTICS_DATABASE || process.env.DATABASE_NAME || 'email_analytics',
    dashboard1Collection: process.env.DASHBOARD1_COLLECTION || 'dashboard_response',
    dashboard2Collection: process.env.DASHBOARD2_COLLECTION || 'dashboard_aging',
  };
};

/**
 * MongoDB connection class with singleton pattern
 */
class MongoDBConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoDBConfig;
  private isConnecting: boolean = false;

  constructor() {
    this.config = getMongoDBConfig();
  }

  /**
   * Establish connection to MongoDB
   * @returns {Promise<Db>} Promise that resolves with database instance
   */
  async connect(): Promise<Db> {
    try {
      logger.info(`[MONGODB] ========== MongoDB Connection ==========`);
      
      // If already connected, return existing database
      if (this.client && this.db) {
        logger.debug('[MONGODB] ✓ Using existing MongoDB connection');
        return this.db;
      }

      // If connection is in progress, wait for it
      if (this.isConnecting) {
        logger.debug('[MONGODB] Connection already in progress, waiting...');
        while (this.isConnecting) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.db) return this.db;
      }

      this.isConnecting = true;

      logger.info('[MONGODB] Attempting to connect to MongoDB...');
      logger.info(`[MONGODB] URI: ${this.config.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
      logger.info(`[MONGODB] Database: ${this.config.database}`);

      // Check if using MongoDB Atlas (srv protocol)
      const isAtlas = this.config.uri.includes('mongodb+srv://');

      const options: MongoClientOptions = {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 10000, // Increased timeout for Atlas
        socketTimeoutMS: 45000,
        // TLS configuration for MongoDB Atlas
        tls: isAtlas,
        tlsAllowInvalidCertificates: true, // Allow self-signed certificates for development
        tlsAllowInvalidHostnames: true, // Allow hostname mismatches for development
      };

      this.client = new MongoClient(this.config.uri, options);
      logger.info('[MONGODB] MongoClient created, connecting...');
      
      await this.client.connect();
      logger.info('[MONGODB] ✓ Client connected successfully');

      this.db = this.client.db(this.config.database);
      logger.info(`[MONGODB] Database instance obtained: ${this.config.database}`);

      // Test connection
      logger.info('[MONGODB] Testing connection with ping...');
      await this.db.admin().ping();
      logger.info('[MONGODB] ✓ Ping successful');

      logger.info(`[MONGODB] ✅ Connected to MongoDB database: ${this.config.database}`);
      logger.info('[MONGODB] ========== Connection Complete ==========');
      this.isConnecting = false;

      return this.db;
    } catch (error) {
      this.isConnecting = false;
      logger.error('[MONGODB] ========== Connection Failed ==========');
      logger.error('[MONGODB] Error details:', error);
      if (error instanceof Error) {
        logger.error(`[MONGODB] Error message: ${error.message}`);
        logger.error(`[MONGODB] Error name: ${error.name}`);
      }
      throw error;
    }
  }

  /**
   * Get database instance (creates connection if not exists)
   * @returns {Promise<Db>} Database instance
   */
  async getDatabase(): Promise<Db> {
    if (!this.db) {
      return await this.connect();
    }
    return this.db;
  }

  /**
   * Get a collection from the database
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<any>} Collection instance
   */
  async getCollection(collectionName: string) {
    const database = await this.getDatabase();
    return database.collection(collectionName);
  }

  /**
   * Get Dashboard1 collection
   * @returns {Promise<any>} Dashboard1 collection instance
   */
  async getDashboard1Collection() {
    return await this.getCollection(this.config.dashboard1Collection);
  }

  /**
   * Get Dashboard2 collection
   * @returns {Promise<any>} Dashboard2 collection instance
   */
  async getDashboard2Collection() {
    return await this.getCollection(this.config.dashboard2Collection);
  }

  /**
   * Close the MongoDB connection
   * @returns {Promise<void>} Promise that resolves when connection is closed
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.client = null;
        this.db = null;
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        throw error;
      }
    }
  }

  /**
   * Check if connected to MongoDB
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Get the MongoDB configuration
   * @returns {MongoDBConfig} Current MongoDB configuration
   */
  getConfig(): MongoDBConfig {
    return this.config;
  }

  /**
   * Get a specific database by name
   * @param {string} dbName - Name of the database
   * @returns {Promise<Db>} Database instance
   */
  async getDatabaseByName(dbName: string): Promise<Db> {
    // Ensure client is connected
    if (!this.client) {
      await this.connect();
    }
    
    if (!this.client) {
      throw new Error('MongoDB client not initialized');
    }
    
    return this.client.db(dbName);
  }
}

// Export singleton instance
export const mongodb = new MongoDBConnection();
export default mongodb;

