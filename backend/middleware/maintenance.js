import jwt from 'jsonwebtoken';
import { isMaintenanceMode } from '../utils/siteSettings.js';

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenance = await isMaintenanceMode();
    if (!maintenance) {
      return next();
    }

    // Paths allowed during maintenance mode
    const path = req.path || req.originalUrl || '';
    if (
      path === '/health' ||
      path === '/api/test' ||
      path === '/api/settings/public' ||
      path.startsWith('/api/admin') ||
      path.startsWith('/api/payment/stripe/webhook')
    ) {
      return next();
    }

    // Check if an admin token is provided in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && (decoded.role === 'admin' || decoded.isAdmin)) {
            return next();
          }
        } catch {
          // Invalid token, proceed to 503
        }
      }
    }

    return res.status(503).json({
      success: false,
      error: 'Site is currently undergoing maintenance. Please check back soon.',
      maintenanceMode: true,
    });
  } catch (error) {
    return next(error);
  }
};

export default checkMaintenanceMode;
