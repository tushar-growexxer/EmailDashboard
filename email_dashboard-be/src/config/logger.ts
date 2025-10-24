import * as winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, service, stack, ...meta }) => {
  let levelText = typeof level === 'string' ? level.toUpperCase() : String(level);
  let logMessage = `[${timestamp}] [${levelText}] [${service}] ${message}`;
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    logMessage += `\n  Metadata: ${JSON.stringify(meta, null, 2)}`;
  }
  
  // Add stack trace for errors
  if (stack) {
    logMessage += `\n  Stack Trace:\n${stack}`;
  }
  
  return logMessage;
});

// File format with proper spacing
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  customFormat
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, service, stack, ...meta }) => {
    let logMessage = `[${timestamp}] ${level} [${service}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n  📋 Data: ${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n  🔍 Stack:\n${stack}`;
    }
    
    return logMessage;
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: { service: 'email-dashboard-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: fileFormat
    }),
  ],
});

// Add console transport for development (always add in development, or when explicitly requested)
const shouldAddConsole = process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true';
if (shouldAddConsole) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export default logger;


