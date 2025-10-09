import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Request logging middleware with enhanced formatting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Create detailed log entry
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${durationMs}ms`,
      ip: clientIP,
      userAgent: userAgent,
      contentLength: res.get('Content-Length') || 0,
    };
    
    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${req.originalUrl}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(`HTTP ${req.method} ${req.originalUrl}`, logData);
    }
  });
  
  next();
};


