// Projects Controller
import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { workflowService } from '../services/workflow.service';
import { asyncHandler } from '../middleware/error.middleware';
import {
  DeliverableType,
  ProjectStatus,
  Priority,
  WorkflowStepStatus,
} from '@prisma/client';
import { prisma } from '../config/database';

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
    const { id } = req.params;

    const workflow = await prisma.projectWorkflow.findMany({
      where: { projectId: id },
      orderBy: { stepSequence: 'asc' },
    });

    if (workflow.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found for this project',
      });
    }

    const totalSteps = workflow.length;
    const completedSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.completed
    ).length;
    const inProgressSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.in_progress
    ).length;
    const notStartedSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.not_started
    ).length;
    const blockedSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.blocked
    ).length;

    const percentComplete =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const inProgressStep = workflow.find(
      step => step.status === WorkflowStepStatus.in_progress
    );

    let estimatedCompletionDate: string | null = null;
    let isOnTrack = true;

    if (inProgressStep && inProgressStep.startDate) {
      const startDate = new Date(inProgressStep.startDate);
      const estimatedDays = inProgressStep.dueDate
        ? Math.max(
            0,
            Math.ceil(
              (inProgressStep.dueDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null;

      if (estimatedDays !== null) {
        const estimatedEnd = new Date(startDate);
        estimatedEnd.setDate(estimatedEnd.getDate() + estimatedDays);

        const now = new Date();
        const daysElapsed = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        isOnTrack = daysElapsed <= estimatedDays;

        const remainingDays = workflow
          .filter(step => step.stepSequence > inProgressStep.stepSequence)
          .map(step => {
            if (!step.startDate || !step.dueDate) return 0;
            return Math.max(
              0,
              Math.ceil(
                (step.dueDate.getTime() - step.startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          })
          .reduce((sum, days) => sum + days, 0);

        estimatedEnd.setDate(estimatedEnd.getDate() + remainingDays);
        estimatedCompletionDate = estimatedEnd.toISOString();
      }
    }

    const progress = {
      totalSteps,
      completedSteps,
      inProgressSteps,
      notStartedSteps,
      blockedSteps,
      percentComplete,
      estimatedCompletionDate,
      isOnTrack,
    };

    res.json({
      success: true,
      data: progress,
    });
  });
}

export const projectsController = new ProjectsController();
