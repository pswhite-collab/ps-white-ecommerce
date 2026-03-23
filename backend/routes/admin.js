import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import {
  getAdminAnalytics,
  getAdminCustomerById,
  getAdminCustomers,
  getAdminDashboard,
  getAdminOrders,
  getCustomerReading,
  getDashboardReadingStats,
  getReadingAnalytics,
} from '../controllers/adminController.js';

const router = Router();

router.get('/dashboard/stats', protect, adminProtect, getAdminDashboard);
router.get('/dashboard/reading-stats', protect, adminProtect, getDashboardReadingStats);
router.get('/dashboard', protect, adminProtect, getAdminDashboard);
router.get('/orders', protect, adminProtect, getAdminOrders);
router.get('/customers', protect, adminProtect, getAdminCustomers);
router.get('/customers/:id/reading', protect, adminProtect, getCustomerReading);
router.get('/customers/:id', protect, adminProtect, getAdminCustomerById);
router.get('/analytics', protect, adminProtect, getAdminAnalytics);
router.get('/reading-analytics', protect, adminProtect, getReadingAnalytics);

export default router;
