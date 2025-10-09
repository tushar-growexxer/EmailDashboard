// @ts-ignore - hdb doesn't have TypeScript definitions
import * as hdb from 'hdb';
import logger from './logger';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  schema: string;
  usersTable: string;
}

/**
 * Get database configuration from environment variables
 * @returns {DatabaseConfig} Database configuration object
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    host: process.env.SAP_HANA_HOST ?? 'localhost',
    port: parseInt(process.env.SAP_HANA_PORT ?? '30015'),
    user: process.env.SAP_HANA_USER ?? '',
    password: process.env.SAP_HANA_PASSWORD ?? '',
    schema: process.env.SAP_HANA_SCHEMA ?? 'YOUR_SCHEMA',
    usersTable: process.env.SAP_HANA_USERS_TABLE ?? 'YOUR_USERS_TABLE',
  };
};

/**
 * Database connection class
*/
class DatabaseConnection {
  private client: hdb.Client | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = getDatabaseConfig();
  }

  /**
   * Establish connection to SAP HANA database
   * @returns {Promise<void>} Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    try {
      this.client = hdb.createClient({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        useTLS: false, // Set to true in production with proper certificates
      });

      await new Promise<void>((resolve, reject) => {
        this.client!.connect((err: any) => {
          if (err) {
            logger.error('Database connection failed:', err);
            reject(err);
          } else {
            logger.info('Connected to SAP HANA database successfully');
            resolve();
          }
        });
      });
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Execute a query on the database
   * @param {string} sql - SQL query to execute
   * @param {any[]} params - Query parameters
   * @returns {Promise<any[]>} Query results
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client) {
      throw new Error('Database client not initialized. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.client!.exec(sql, params, (err: any, rows: any) => {
        if (err) {
          logger.error('Database query failed:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Execute a prepared statement
   * @param {string} sql - SQL query with placeholders
   * @param {any[]} params - Parameters for the prepared statement
   * @returns {Promise<any[]>} Query results
   */
  async preparedStatement(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client) {
      throw new Error('Database client not initialized. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.client!.prepare(sql, (err: any, statement: any) => {
        if (err) {
          logger.error('Failed to prepare statement:', err);
          reject(err);
          return;
        }

        statement.exec(params, (execErr: any, rows: any) => {
          if (execErr) {
            logger.error('Prepared statement execution failed:', execErr);
            reject(execErr);
          } else {
            resolve(rows || []);
          }
        });
      });
    });
  }

  /**
   * Close the database connection
   * @returns {Promise<void>} Promise that resolves when connection is closed
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.close(() => {
          logger.info('Database connection closed');
          resolve();
        });
      });
    }
  }

  /**
   * Get the database configuration
   * @returns {DatabaseConfig} Current database configuration
   */
  getConfig(): DatabaseConfig {
    return this.config;
  }

  /**
   * Check if the client is connected
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const db = new DatabaseConnection();
export default db;
