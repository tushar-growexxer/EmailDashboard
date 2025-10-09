import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './config/logger';
import db from './config/database';

const PORT = process.env.PORT || 3000;

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  let dbConnected = false;

  try {
    // Try to connect to database (optional in development)
    try {
      await db.connect();
      dbConnected = true;
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed - running in offline mode', {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        note: 'API will start but database operations will fail. Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env file'
      });
    }
    
    // Start the server regardless of database connection
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`API endpoints available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      
      if (!dbConnected) {
        logger.warn('⚠️  Database not connected - authentication and user management endpoints will not work');
        logger.info('📝 To enable database features:');
        logger.info('   1. Configure SAP HANA database connection in .env file');
        logger.info('   2. Run: pnpm run setup:db (when database is configured)');
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        if (dbConnected) {
          await db.disconnect();
        }
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        if (dbConnected) {
          await db.disconnect();
        }
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();


