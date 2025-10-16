import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './config/logger';
import db from './config/database';
import mongodb from './config/mongodb';

const PORT = process.env.PORT || 3000;

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  let dbConnected = false;
  let mongoConnected = false;

  try {
    // Try to connect to SAP HANA database (optional in development)
    try {
      await db.connect();
      dbConnected = true;
      logger.info('SAP HANA Database connected successfully');
    } catch (dbError) {
      logger.warn('SAP HANA Database connection failed - running in offline mode', {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        note: 'API will start but database operations will fail. Configure SAP_HANA_* variables in .env file'
      });
    }

    // Try to connect to MongoDB (for analytics dashboard)
    try {
      await mongodb.connect();
      mongoConnected = true;
      logger.info('MongoDB connected successfully');
    } catch (mongoError) {
      logger.warn('MongoDB connection failed - dashboard data will not be available', {
        error: mongoError instanceof Error ? mongoError.message : 'Unknown MongoDB error',
        note: 'Configure MONGODB_URI in .env file to enable dashboard features'
      });
    }
    
    // Start the server regardless of database connection
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`API endpoints available at http://localhost:${PORT}/api`);
      
      if (!dbConnected) {
        logger.warn('⚠️  SAP HANA Database not connected - authentication and user management endpoints will not work');
        logger.info('To enable database features:');
        logger.info('   1. Configure SAP HANA database connection in .env file');
        logger.info('   2. Run: pnpm run setup:db (when database is configured)');
      }

      if (!mongoConnected) {
        logger.warn('⚠️  MongoDB not connected - dashboard endpoints will not work');
        logger.info('To enable dashboard features:');
        logger.info('   1. Configure MONGODB_URI, ANALYTICS_DATABASE in .env file');
        logger.info('   2. Ensure MongoDB is running and accessible');
      }

      if (dbConnected && mongoConnected) {
        logger.info('✅ All database connections established successfully');
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
        if (mongoConnected) {
          await mongodb.disconnect();
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
        if (mongoConnected) {
          await mongodb.disconnect();
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


