import { Router } from 'express';
import auth from '../middleware/auth.js';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';

const router = Router();

router.post('/', auth, createOrder);
router.get('/mine', auth, getMyOrders);
router.get('/:id', auth, getOrderById);

export default router;
