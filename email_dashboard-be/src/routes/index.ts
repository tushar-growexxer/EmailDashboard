import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
// NOTE: userRoutes disabled - SAP HANA user management not used (Google OAuth and LDAP only)
// import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import ldapSyncRoutes from './ldapSync.routes';
import customerSalesRoutes from './customerSales.routes';
import onboardingRoutes from './onboarding.routes';
import googleUsersRoutes from './googleUsers.routes';
import domainManagementRoutes from './domainManagement.routes';

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
      // users: '/users', // Disabled - SAP HANA user management not used
      dashboard: '/dashboard',
      ldapSync: '/ldap-sync',
      customers: '/customers',
      onboarding: '/onboarding',
      googleUsers: '/google-users',
      domains: '/domains',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
// NOTE: /users routes disabled - SAP HANA user management not used (Google OAuth and LDAP only)
// router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ldap-sync', ldapSyncRoutes);
router.use('/customers', customerSalesRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/google-users', googleUsersRoutes);
router.use('/domains', domainManagementRoutes);

export default router;
