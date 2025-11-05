import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router: Router = Router();

/**
 * Dashboard Routes
 * All routes require authentication
 * 
 * GET    /api/dashboard/health              - Health check for MongoDB
 * GET    /api/dashboard/response            - Get all response dashboard data
 * GET    /api/dashboard/aging               - Get all aging dashboard data
 * GET    /api/dashboard/response/user/:id   - Get response data for specific user
 * GET    /api/dashboard/aging/user/:id      - Get aging data for specific user
 * POST   /api/dashboard/refresh-cache       - Manually refresh cache (admin only)
 * GET    /api/dashboard/cache-status        - Get cache status
 */

// Public health check (no auth required)
router.get('/health', dashboardController.healthCheck.bind(dashboardController));

// Protected routes (require authentication)
router.use(authenticateToken);

// Dashboard 1 (Response Dashboard) routes
router.get('/response', dashboardController.getDashboard1.bind(dashboardController));
router.get('/response/user/:userId', dashboardController.getDashboard1ByUser.bind(dashboardController));

// Dashboard 2 (Aging Dashboard) routes
router.get('/aging', dashboardController.getDashboard2.bind(dashboardController));
router.get('/aging/user/:userId', dashboardController.getDashboard2ByUser.bind(dashboardController));

// Dashboard 3 (Sentiment Dashboard) routes
router.get('/sentiment', dashboardController.getDashboard3.bind(dashboardController));

// Cache management routes
router.post('/refresh-cache', dashboardController.refreshCache.bind(dashboardController));
router.get('/cache-status', dashboardController.getCacheStatus.bind(dashboardController));

export default router;

