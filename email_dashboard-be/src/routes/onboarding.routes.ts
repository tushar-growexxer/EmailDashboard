import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

/**
 * Onboarding routes
 */
const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/onboarding/complete
 * @desc    Initiate Gmail sync OAuth flow (user clicked sync button)
 * @access  Private
 */
router.post('/complete', onboardingController.completeOnboarding.bind(onboardingController));

/**
 * @route   POST /api/v1/onboarding/skip
 * @desc    Skip onboarding (user clicked skip button) - sets hasCompletedOnboarding but not hasSynced
 * @access  Private
 */
router.post('/skip', onboardingController.skipOnboarding.bind(onboardingController));

export default router;
