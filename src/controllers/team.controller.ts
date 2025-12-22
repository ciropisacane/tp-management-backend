// Backend: src/controllers/team.controller.ts
import { Request, Response } from 'express';
import { teamService } from '../services/team.service';
import { asyncHandler } from '../middleware/error.middleware';

class TeamController {
  /**
   * GET /api/projects/:projectId/team
   * Get project team members
   */
  getProjectTeam = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const team = await teamService.getProjectTeam(projectId);

    res.json({
      success: true,
      data: team
    });
  });

  /**
   * POST /api/projects/:projectId/team
   * Add team member to project
   */
  addTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { userId, roleInProject, allocationPercentage, assignedDate } = req.body;

    const teamMember = await teamService.addTeamMember({
      projectId,
      userId,
      roleInProject,
      allocationPercentage: allocationPercentage || 100,
      assignedDate: assignedDate ? new Date(assignedDate) : new Date()
    });

    res.status(201).json({
      success: true,
      data: teamMember,
      message: 'Team member added successfully'
    });
  });

  /**
   * PUT /api/projects/:projectId/team/:userId
   * Update team member
   */
  updateTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    const { roleInProject, allocationPercentage } = req.body;

    const teamMember = await teamService.updateTeamMember(projectId, userId, {
      roleInProject,
      allocationPercentage
    });

    res.json({
      success: true,
      data: teamMember,
      message: 'Team member updated successfully'
    });
  });

  /**
   * DELETE /api/projects/:projectId/team/:userId
   * Remove team member from project
   */
  removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;

    await teamService.removeTeamMember(projectId, userId);

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  });

  /**
   * GET /api/projects/:projectId/team/available
   * Get available users to add to project
   */
  getAvailableUsers = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const users = await teamService.getAvailableUsers(projectId);

    res.json({
      success: true,
      data: users
    });
  });
}

export const teamController = new TeamController();
