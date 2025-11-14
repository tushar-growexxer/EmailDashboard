import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './config/logger';
import db from './config/database';
import mongodb from './config/mongodb';

const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  let dbConnected = false;
  let mongoConnected = false;

  try {
    // NOTE: SAP HANA connection is now lazy-loaded (connects only when needed for customer data queries)
    // User authentication uses Google OAuth and LDAP (MongoDB), not SAP HANA
    // SAP HANA is only used for customer sales data queries
    logger.info('SAP HANA connection will be established on-demand when customer data is requested');
    dbConnected = false; // Mark as not connected on startup

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

    // Bind to 0.0.0.0 to allow access from other devices on the network
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT as number, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`API endpoints available at http://localhost:${PORT}/api`);
      logger.info(`Network access available at http://192.168.10.6:${PORT}/api`);

      // SAP HANA connection is lazy-loaded - no warning needed
      logger.info('ℹ️  SAP HANA will connect automatically when customer data is requested');
      logger.info('   Authentication uses Google OAuth and LDAP (MongoDB only)');

      if (!mongoConnected) {
        logger.warn('⚠️  MongoDB not connected - dashboard endpoints will not work');
        logger.info('To enable dashboard features:');
        logger.info('   1. Configure MONGODB_URI, ANALYTICS_DATABASE in .env file');
        logger.info('   2. Ensure MongoDB is running and accessible');
      }

      if (mongoConnected) {
        logger.info('✅ MongoDB connected - Application ready');
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


