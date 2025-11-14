import { Router } from 'express';
import { domainManagementController } from '../controllers/domainManagement.controller';
import { authenticateToken, requireSuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Domain Management Routes
 * All routes require authentication and super admin role
 */

// Get all allowed domains
router.get(
  '/',
  authenticateToken,
  requireSuperAdmin,
  domainManagementController.getAllDomains.bind(domainManagementController)
);

// Add a new allowed domain
router.post(
  '/',
  authenticateToken,
  requireSuperAdmin,
  domainManagementController.addDomain.bind(domainManagementController)
);

// Update a domain
router.put(
  '/:id',
  authenticateToken,
  requireSuperAdmin,
  domainManagementController.updateDomain.bind(domainManagementController)
);

// Delete a domain
router.delete(
  '/:id',
  authenticateToken,
  requireSuperAdmin,
  domainManagementController.deleteDomain.bind(domainManagementController)
);

// Check if email domain is allowed (public endpoint for validation)
router.post(
  '/check',
  domainManagementController.checkDomain.bind(domainManagementController)
);

export default router;

