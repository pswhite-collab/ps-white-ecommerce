import { Router } from 'express';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { getAdminDashboard } from '../controllers/adminController.js';

const router = Router();

router.get('/dashboard', auth, adminAuth, getAdminDashboard);

export default router;
