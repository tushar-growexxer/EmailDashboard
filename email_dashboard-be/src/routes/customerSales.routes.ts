import { Router } from 'express';
import customerSalesController from '../controllers/customerSales.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router: Router = Router();

/**
 * Customer Sales Routes
 * All routes require authentication
 * 
 * GET    /api/customers/sales           - Get all customer sales data
 * GET    /api/customers/search          - Search customers by name
 * GET    /api/customers/:cardCode       - Get customer by CardCode
 * POST   /api/customers/refresh-cache   - Manually refresh cache
 * GET    /api/customers/cache-status    - Get cache status
 */

// Protected routes (require authentication)
router.use(authenticateToken);

// Customer sales routes
router.get('/sales', customerSalesController.getAllCustomers.bind(customerSalesController));
router.get('/search', customerSalesController.searchCustomers.bind(customerSalesController));
router.get('/cache-status', customerSalesController.getCacheStatus.bind(customerSalesController));
router.post('/refresh-cache', customerSalesController.refreshCache.bind(customerSalesController));
router.get('/:cardCode', customerSalesController.getCustomerByCardCode.bind(customerSalesController));

export default router;
