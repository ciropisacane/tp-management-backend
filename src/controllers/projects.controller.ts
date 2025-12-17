// Projects Controller
import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { workflowService } from '../services/workflow.service';
import { asyncHandler } from '../middleware/error.middleware';
import { DeliverableType, ProjectStatus, Priority } from '@prisma/client';

class ProjectsController {
  /**
   * POST /api/projects
   * Create a new project
   */
  createProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.createProject(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
    });
  });

  /**
   * GET /api/projects
   * Get all projects with filters and pagination
   */
  getProjects = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      clientId: req.query.clientId as string,
      deliverableType: req.query.deliverableType as DeliverableType,
      status: req.query.status as ProjectStatus,
      priority: req.query.priority as Priority,
      projectManagerId: req.query.projectManagerId as string,
      teamMemberId: req.query.teamMemberId as string,
      startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
      startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
      deadlineFrom: req.query.deadlineFrom ? new Date(req.query.deadlineFrom as string) : undefined,
      deadlineTo: req.query.deadlineTo ? new Date(req.query.deadlineTo as string) : undefined,
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await projectService.getProjects(
      filters,
      pagination,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: result.projects,
      pagination: result.pagination,
    });
  });

  /**
   * GET /api/projects/:id
   * Get project by ID
   */
  getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: project,
    });
  });

  /**
   * PUT /api/projects/:id
   * Update project
   */
  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });
  });

  /**
   * DELETE /api/projects/:id
   * Archive project
   */
  deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.deleteProject(
      req.params.id,
      req.user!.userId
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * POST /api/projects/:id/status
   * Change project status
   */
  changeProjectStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const project = await projectService.changeProjectStatus(
      req.params.id,
      status,
      req.user!.userId
    );

    res.json({
      success: true,
      data: project,
      message: 'Project status updated successfully',
    });
  });

  /**
   * GET /api/projects/:id/workflow
   * Get project workflow steps
   */
  getProjectWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const workflow = await workflowService.getProjectWorkflow(req.params.id);

    res.json({
      success: true,
      data: workflow,
    });
  });

  /**
   * PUT /api/projects/:id/workflow/:stepId
   * Update workflow step
   */
  updateWorkflowStep = asyncHandler(async (req: Request, res: Response) => {
    const step = await workflowService.updateWorkflowStep(
      req.params.stepId,
      req.body
    );

    res.json({
      success: true,
      data: step,
      message: 'Workflow step updated successfully',
    });
  });

  /**
   * GET /api/projects/:id/stats
   * Get project statistics
   */
  getProjectStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await projectService.getProjectStats(req.params.id);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * POST /api/projects/:id/team
   * Add team member to project
   */
  addTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const { userId, roleInProject, allocationPercentage } = req.body;

    const teamMember = await projectService.addTeamMember(
      req.params.id,
      userId,
      roleInProject,
      allocationPercentage
    );

    res.status(201).json({
      success: true,
      data: teamMember,
      message: 'Team member added successfully',
    });
  });

  /**
   * DELETE /api/projects/:id/team/:teamMemberId
   * Remove team member from project
   */
  removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.removeTeamMember(
      req.params.id,
      req.params.teamMemberId
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * GET /api/projects/:id/progress
   * Get workflow progress
   */
  getWorkflowProgress = asyncHandler(async (req: Request, res: Response) => {
    const progress = await workflowService.getWorkflowProgress(req.params.id);

    res.json({
      success: true,
      data: progress,
    });
  });
}

export const projectsController = new ProjectsController();
