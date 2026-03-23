import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/', protect, adminProtect, getSettings);
router.put('/', protect, adminProtect, updateSettings);

export default router;
