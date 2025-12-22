// Backend: src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../middleware/error.middleware';

class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const stats = await dashboardService.getStats(userId);

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * GET /api/dashboard/activity
   * Get user activity
   */
  getActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 7;

    const activity = await dashboardService.getActivity(userId, days);

    res.json({
      success: true,
      data: activity
    });
  });
}

export const dashboardController = new DashboardController();
