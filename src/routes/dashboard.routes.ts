// Backend: src/routes/dashboard.routes.ts
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', dashboardController.getStats);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get user activity
 * @access  Private
 */
router.get('/activity', dashboardController.getActivity);

export default router;
