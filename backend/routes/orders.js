import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrders,
  processRefund,
  sendShippingNotification,
  updateOrderTracking,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/all', protect, adminProtect, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminProtect, updateOrderStatus);
router.put('/:id/tracking', protect, adminProtect, updateOrderTracking);
router.post('/:id/notify-shipping', protect, adminProtect, sendShippingNotification);
router.post('/:id/refund', protect, adminProtect, processRefund);

export default router;
