import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import { getPublicSettings, getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/public', getPublicSettings);
router.get('/', protect, adminProtect, getSettings);
router.put('/', protect, adminProtect, updateSettings);

export default router;
