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
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request
  logger.info(`[REQ-${requestId}] ========== Incoming Request ==========`);
  logger.info(`[REQ-${requestId}] ${req.method} ${req.originalUrl}`);
  logger.info(`[REQ-${requestId}] IP: ${req.ip || req.connection.remoteAddress || 'unknown'}`);
  logger.info(`[REQ-${requestId}] User-Agent: ${req.get('User-Agent') || 'unknown'}`);
  logger.info(`[REQ-${requestId}] Origin: ${req.get('Origin') || 'none'}`);
  logger.info(`[REQ-${requestId}] Referer: ${req.get('Referer') || 'none'}`);
  
  // Log query params if present
  if (Object.keys(req.query).length > 0) {
    logger.info(`[REQ-${requestId}] Query params:`, req.query);
  }
  
  // Log body for POST/PUT/PATCH (excluding sensitive fields)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.token) sanitizedBody.token = '***';
    logger.info(`[REQ-${requestId}] Body:`, sanitizedBody);
  }
  
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
      logger.error(`[REQ-${requestId}] ❌ ${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs}ms)`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`[REQ-${requestId}] ⚠ ${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs}ms)`, logData);
    } else {
      logger.info(`[REQ-${requestId}] ✓ ${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs}ms)`, logData);
    }
    logger.info(`[REQ-${requestId}] ========== Request Complete ==========`);
  });
  
  next();
};


