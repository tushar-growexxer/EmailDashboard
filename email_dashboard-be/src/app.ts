import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/requestLogger.middleware';

const app: Application = express();

// CORS Configuration - Allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://192.168.10.6:5173', 'http://192.168.56.1:5173'];

console.log('CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log(`CORS: Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        console.error(`CORS: Blocked origin: ${origin}`);
        console.error(`   Expected one of: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Not allowed by CORS. Origin '${origin}' is not in the allowed list.`));
      }
    },
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies for authentication

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Health check (doesn't require database)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'email-dashboard-api',
    version: process.env.API_VERSION || 'v1'
  });
});

// Database health check
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    const db = (await import('./config/database')).default;
    if (db.isConnected()) {
      res.status(200).json({
        status: 'OK',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'ERROR',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// Error handler
app.use(errorHandler);

export default app;


