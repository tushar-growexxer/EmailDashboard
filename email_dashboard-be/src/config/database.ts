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
  // Prefer VPN host if available, fallback to direct host
  const host = process.env.SAP_HANA_VPN_HOST || process.env.SAP_HANA_HOST || '192.168.10.6';
  
  return {
    host: host,
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
  private isConnecting: boolean = false;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelayMs = 2000; // 2s
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private readonly keepaliveIntervalMs = 60000; // 60s - ping every minute

  constructor() {
    this.config = getDatabaseConfig();
  }

  /**
   * Establish connection to SAP HANA database
   * @returns {Promise<void>} Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    try {
      if (this.client && this.isConnected()) {
        logger.info('Database client already connected');
        return;
      }
      if (this.isConnecting) {
        logger.info('Database connect already in progress');
        return;
      }
      
      // Clean up any existing client before creating a new one
      if (this.client) {
        logger.warn('Cleaning up existing disconnected client');
        try {
          this.client.removeAllListeners();
          this.client.end();
        } catch (cleanupErr) {
          logger.warn('Error during client cleanup:', cleanupErr);
        }
        this.client = null;
      }
      
      this.isConnecting = true;
      logger.info(`Attempting to connect to SAP HANA database at ${this.config.host}:${this.config.port}`);
      logger.info(`Using user: ${this.config.user}, schema: ${this.config.schema}`);
      
      this.client = hdb.createClient({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        useTLS: false, // Set to true in production with proper certificates
        connectTimeout: 30000, // 30 seconds connection timeout
        socketTimeout: 0, // No socket timeout (keep connection alive)
        autoReconnect: true, // Enable auto-reconnect
      });

      await new Promise<void>((resolve, reject) => {
        // Remove any existing listeners to prevent duplicates
        this.client!.removeAllListeners('error');
        this.client!.removeAllListeners('close');

        this.client!.on('error', (err: any) => {
          logger.error('HDB client error event:', err);
          logger.error('Error code:', err.code);
          logger.error('Error message:', err.message);
        });

        this.client!.on('close', () => {
          logger.warn('HDB client closed event received');
          logger.warn(`Connection state before clearing: ${this.client?.readyState}`);
          this.client = null; // Clear the client reference
          void this.handleReconnect();
        });

        this.client!.connect((err: any) => {
          this.isConnecting = false;
          if (err) {
            logger.error(`Database connection failed to ${this.config.host}:${this.config.port}:`, err);
            reject(err);
          } else {
            logger.info(`✅ Connected to SAP HANA database successfully at ${this.config.host}:${this.config.port}`);
            logger.info(`Connection state after connect: ${this.client!.readyState}`);
            
            // Test the connection immediately with a simple query
            this.client!.exec('SELECT 1 FROM DUMMY', [], (testErr: any) => {
              if (testErr) {
                logger.error('Connection test query failed immediately after connect:', testErr);
                reject(new Error('Connection test failed: ' + testErr.message));
              } else {
                logger.info('✅ Connection test query successful');
                this.startKeepalive();
                resolve();
              }
            });
          }
        });
      });
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Start keepalive mechanism to prevent idle connection timeout
   */
  private startKeepalive(): void {
    // Clear any existing keepalive
    this.stopKeepalive();

    this.keepaliveInterval = setInterval(() => {
      if (this.client && this.isConnected()) {
        // Execute a simple query to keep connection alive
        this.client.exec('SELECT 1 FROM DUMMY', [], (err: any) => {
          if (err) {
            logger.warn('Keepalive query failed:', err);
          }
        });
      }
    }, this.keepaliveIntervalMs);

    logger.info('Connection keepalive started');
  }

  /**
   * Stop keepalive mechanism
   */
  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  /**
   * Execute a query on the database
   * @param {string} sql - SQL query to execute
   * @param {any[]} params - Query parameters
   * @returns {Promise<any[]>} Query results
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client || !this.isConnected()) {
      logger.warn('Client not connected, attempting to reconnect before query');
      await this.connect();
    }

    try {
      return await this.execWithRetry((cb) => this.client!.exec(sql, params, cb));
    } catch (err) {
      logger.error('Database query failed after retry:', err);
      throw err;
    }
  }

  /**
   * Execute a prepared statement
   * @param {string} sql - SQL query with placeholders
   * @param {any[]} params - Parameters for the prepared statement
   * @returns {Promise<any[]>} Query results
   */
  async preparedStatement(sql: string, params: any[] = []): Promise<any[]> {
    // Always check connection state before executing
    if (!this.client) {
      logger.warn('Client is null, attempting to connect before prepared statement');
      await this.connect();
    } else if (!this.isConnected()) {
      logger.warn(`Client not connected (state: ${this.client.readyState}), attempting to reconnect before prepared statement`);
      await this.connect();
    }

    try {
      return await this.execWithRetry((cb) => {
        // Double-check client exists and is connected before using it
        if (!this.client) {
          cb(new Error('Database client is null'));
          return;
        }

        const currentState = this.client.readyState;
        if (currentState !== 'connected') {
          logger.warn(`Client state is ${currentState}, not connected. Triggering reconnect.`);
          cb(new Error(`Connection closed (state: ${currentState})`));
          return;
        }

        this.client.prepare(sql, (err: any, statement: any) => {
          if (err) {
            logger.error('Failed to prepare statement:', err);
            cb(err);
            return;
          }

          statement.exec(params, (execErr: any, rows: any) => {
            if (execErr) {
              cb(execErr);
            } else {
              cb(null, rows || []);
            }
          });
        });
      });
    } catch (err) {
      logger.error('Prepared statement failed after retry:', err);
      throw err;
    }
  }

  /**
   * Handle reconnection attempts with backoff
   */
  private async handleReconnect(): Promise<void> {
    // If already connecting, skip
    if (this.isConnecting) return;

    let attempt = 0;
    while (attempt < this.maxReconnectAttempts) {
      attempt += 1;
      logger.info(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}...`);
      try {
        await this.connect();
        logger.info('Reconnected to SAP HANA successfully');
        return;
      } catch (err) {
        logger.warn(`Reconnect attempt ${attempt} failed:`, err);
        // wait before next attempt
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, this.reconnectDelayMs * attempt));
      }
    }

    logger.error('Max reconnect attempts reached. Manual intervention required.');
  }

  /**
   * Helper to execute an hdb-style callback API with a single retry on connection-close errors.
   * The executor receives a callback cb(err, result).
   */
  private async execWithRetry(executor: (cb: (err: any, res?: any) => void) => void): Promise<any> {
    const attemptExec = () => new Promise<any>((resolve, reject) => {
      try {
        executor((err: any, res?: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } catch (e) {
        reject(e);
      }
    });

    try {
      return await attemptExec();
    } catch (err: any) {
      // If connection closed, try reconnect once
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';
      const combinedMessage = `${errorCode} ${errorMessage}`.toLowerCase();
      
      if (combinedMessage.includes('ehdbclose') || 
          combinedMessage.includes('connection closed') ||
          combinedMessage.includes('state:') ||
          errorCode === 'EHDBCLOSE') {
        logger.warn('Detected closed connection during DB operation, attempting reconnect and retry');
        logger.warn(`Error details - Code: ${errorCode}, Message: ${errorMessage}`);
        
        try {
          // Force reconnect
          this.stopKeepalive();
          this.client = null;
          await this.connect();
          
          logger.info('Reconnected successfully, retrying operation');
          return await attemptExec();
        } catch (retryErr) {
          logger.error('Retry after reconnect failed:', retryErr);
          throw retryErr;
        }
      }

      throw err;
    }
  }

  /**
   * Close the database connection
   * @returns {Promise<void>} Promise that resolves when connection is closed
   */
  async disconnect(): Promise<void> {
    this.stopKeepalive();
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.close(() => {
          logger.info('Database connection closed');
          this.client = null;
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
    if (!this.client) {
      return false;
    }
    const state = this.client.readyState;
    logger.debug(`Current connection state: ${state}`);
    return state === 'connected';
  }
}

// Export singleton instance
export const db = new DatabaseConnection();
export default db;
