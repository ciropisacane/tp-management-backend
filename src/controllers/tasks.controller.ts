// Tasks Controller
import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { asyncHandler } from '../middleware/error.middleware';
import { TaskStatus, Priority } from '@prisma/client';

class TasksController {
  /**
   * POST /api/tasks
   * Create a new task
   */
  createTask = asyncHandler(async (req: Request, res: Response) => {
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

    const taskInput = {
      projectId: req.body.projectId,
      workflowStepId: req.body.workflowStepId || undefined,
      title: req.body.title,
      description: req.body.description || undefined,
      assignedTo: req.body.assignedTo || undefined,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : undefined,
      estimatedHours:
        req.body.estimatedHours === undefined || req.body.estimatedHours === ''
          ? undefined
          : Number(req.body.estimatedHours),
      dependencies: Array.isArray(req.body.dependencies)
        ? req.body.dependencies.filter((id: string) => id && id.trim() !== '')
        : undefined,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.filter((tag: string) => tag && tag.trim() !== '')
        : undefined,
    };

    const task = await taskService.createTask(taskInput, req.user!.userId);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  });

  /**
   * GET /api/tasks
   * Get all tasks with filters and pagination
   */
  getTasks = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      projectId: req.query.projectId as string,
      workflowStepId: req.query.workflowStepId as string,
      assignedTo: req.query.assignedTo as string,
      status: req.query.status as TaskStatus,
      priority: req.query.priority as Priority,
      dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
      dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      overdue: req.query.overdue === 'true',
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await taskService.getTasks(
      filters,
      pagination,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
    });
  });

  /**
   * GET /api/tasks/:id
   * Get task by ID
   */
  getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getTaskById(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: task,
    });
  });

  /**
   * PUT /api/tasks/:id
   * Update task
   */
  updateTask = asyncHandler(async (req: Request, res: Response) => {
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

    const updateInput = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo || undefined,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : undefined,
      estimatedHours:
        req.body.estimatedHours === undefined || req.body.estimatedHours === ''
          ? undefined
          : Number(req.body.estimatedHours),
      actualHours:
        req.body.actualHours === undefined || req.body.actualHours === ''
          ? undefined
          : Number(req.body.actualHours),
      dependencies: Array.isArray(req.body.dependencies)
        ? req.body.dependencies.filter((id: string) => id && id.trim() !== '')
        : undefined,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.filter((tag: string) => tag && tag.trim() !== '')
        : undefined,
    };

    const task = await taskService.updateTask(
      req.params.id,
      updateInput,
      req.user!.userId
    );

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  });

  /**
   * DELETE /api/tasks/:id
   * Delete task
   */
  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const result = await taskService.deleteTask(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * GET /api/tasks/my/all
   * Get current user's tasks
   */
  getMyTasks = asyncHandler(async (req: Request, res: Response) => {
    const tasks = await taskService.getMyTasks(req.user!.userId);

    res.json({
      success: true,
      data: tasks,
    });
  });

  /**
   * GET /api/tasks/stats
   * Get task statistics
   */
  getTaskStats = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string;
    const stats = await taskService.getTaskStats(projectId);

    res.json({
      success: true,
      data: stats,
    });
  });
}

export const tasksController = new TasksController();
