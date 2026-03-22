import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', auth, getCurrentUser);

export default router;
