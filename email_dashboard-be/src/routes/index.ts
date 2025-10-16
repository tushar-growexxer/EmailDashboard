import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';

const router: Router = Router();

/**
 * @route   GET /api/
 * @desc    API root endpoint
 * @access  Public
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Email Dashboard API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      users: '/users',
      dashboard: '/dashboard'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;


