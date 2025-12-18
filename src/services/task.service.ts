// Task Service - Business Logic
import { prisma } from '../config/database';
import { TaskStatus, Priority, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface CreateTaskInput {
  projectId: string;
  workflowStepId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  estimatedHours?: number;
  dependencies?: string[]; // Array of task IDs
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  workflowStepId?: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  tags?: string[];
  overdue?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class TaskService {
  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput, createdBy: string) {
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Validate assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: input.assignedTo },
    });

    if (!assignedUser) {
      throw new ValidationError('Assigned user not found');
    }

    // Validate workflow step if provided
    if (input.workflowStepId) {
      const workflowStep = await prisma.projectWorkflow.findUnique({
        where: { id: input.workflowStepId },
      });

      if (!workflowStep || workflowStep.projectId !== input.projectId) {
        throw new ValidationError('Invalid workflow step for this project');
      }
    }

    // Validate dependencies if provided
    if (input.dependencies && input.dependencies.length > 0) {
      const deps = await prisma.task.findMany({
        where: {
          id: { in: input.dependencies },
          projectId: input.projectId,
        },
      });

      if (deps.length !== input.dependencies.length) {
        throw new ValidationError('Some dependency tasks not found or belong to different project');
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        projectId: input.projectId,
        workflowStepId: input.workflowStepId,
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo,
        createdBy,
        status: input.status || TaskStatus.todo,
        priority: input.priority || Priority.medium,
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours,
        actualHours: 0,
        dependencies: input.dependencies || [],
        tags: input.tags || [],
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepName: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        projectId: input.projectId,
        userId: createdBy,
        actionType: 'created',
        entityType: 'task',
        entityId: task.id,
        description: `Created task: ${task.title}`,
      },
    });

    // Create notification for assigned user
    if (input.assignedTo !== createdBy) {
      await prisma.notification.create({
        data: {
          userId: input.assignedTo,
          projectId: input.projectId,
          notificationType: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
          linkUrl: `/projects/${input.projectId}/tasks/${task.id}`,
        },
      });
    }

    return task;
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string, userId: string, userRole: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
            projectManagerId: true,
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepName: true,
            stepSequence: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check access (unless admin/partner)
    if (userRole !== 'admin' && userRole !== 'partner') {
      const isProjectMember = await prisma.projectTeam.findFirst({
        where: {
          projectId: task.projectId,
          userId,
        },
      });

      if (!isProjectMember && task.project.projectManagerId !== userId) {
        throw new ForbiddenError('You do not have access to this task');
      }
    }

    // Get dependency tasks details
    if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      const depTasks = await prisma.task.findMany({
        where: {
          id: { in: task.dependencies as string[] },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });

      return {
        ...task,
        dependencyTasks: depTasks,
      };
    }

    return task;
  }

  /**
   * Get all tasks with filters and pagination
   */
  async getTasks(
    filters: TaskFilters,
    pagination: PaginationOptions,
    userId: string,
    userRole: string
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.TaskWhereInput = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.workflowStepId) {
      where.workflowStepId = filters.workflowStepId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {
        ...(filters.dueDateFrom && { gte: filters.dueDateFrom }),
        ...(filters.dueDateTo && { lte: filters.dueDateTo }),
      };
    }

    if (filters.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: TaskStatus.completed };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasEvery: filters.tags,
      };
    }

    // Apply row-level security (non-admin users see only their project tasks)
    if (userRole !== 'admin' && userRole !== 'partner' && !filters.projectId) {
      const userProjects = await prisma.projectTeam.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const managedProjects = await prisma.project.findMany({
        where: { projectManagerId: userId },
        select: { id: true },
      });

      const projectIds = [
        ...userProjects.map(p => p.projectId),
        ...managedProjects.map(p => p.id),
      ];

      where.projectId = { in: projectIds };
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            timeEntries: true,
          },
        },
      },
    });

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, input: UpdateTaskInput, userId: string) {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // Validate dependencies if provided
    if (input.dependencies && input.dependencies.length > 0) {
      // Check for circular dependencies
      if (input.dependencies.includes(taskId)) {
        throw new ValidationError('Task cannot depend on itself');
      }

      const deps = await prisma.task.findMany({
        where: {
          id: { in: input.dependencies },
          projectId: existingTask.projectId,
        },
      });

      if (deps.length !== input.dependencies.length) {
        throw new ValidationError('Some dependency tasks not found');
      }
    }

    // If completing task, check dependencies are completed
    if (input.status === TaskStatus.completed) {
      if (existingTask.dependencies && Array.isArray(existingTask.dependencies)) {
        const depTasks = await prisma.task.findMany({
          where: {
            id: { in: existingTask.dependencies as string[] },
          },
        });

        const incompleteDeps = depTasks.filter(t => t.status !== TaskStatus.completed);
        if (incompleteDeps.length > 0) {
          throw new ValidationError(
            `Cannot complete task. These dependencies must be completed first: ${incompleteDeps.map(t => t.title).join(', ')}`
          );
        }
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...input,
        ...(input.status === TaskStatus.completed && { completedAt: new Date() }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        projectId: existingTask.projectId,
        userId,
        actionType: 'updated',
        entityType: 'task',
        entityId: task.id,
        description: `Updated task: ${task.title}`,
      },
    });

    // Create notification if status changed to completed
    if (input.status === TaskStatus.completed && existingTask.status !== TaskStatus.completed) {
      await prisma.activityLog.create({
        data: {
          projectId: existingTask.projectId,
          userId,
          actionType: 'task_completed',
          entityType: 'task',
          entityId: task.id,
          description: `Completed task: ${task.title}`,
        },
      });
    }

    // Notify if reassigned
    if (input.assignedTo && input.assignedTo !== existingTask.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: input.assignedTo,
          projectId: existingTask.projectId,
          notificationType: 'task_assigned',
          title: 'Task Reassigned',
          message: `You have been assigned to task: ${task.title}`,
          linkUrl: `/projects/${existingTask.projectId}/tasks/${task.id}`,
        },
      });
    }

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if other tasks depend on this one
    const dependentTasks = await prisma.task.findMany({
      where: {
        dependencies: {
          has: taskId,
        },
      },
    });

    if (dependentTasks.length > 0) {
      throw new ValidationError(
        `Cannot delete task. These tasks depend on it: ${dependentTasks.map(t => t.title).join(', ')}`
      );
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        userId,
        actionType: 'deleted',
        entityType: 'task',
        entityId: taskId,
        description: `Deleted task: ${task.title}`,
      },
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Get tasks by project ID (for Kanban board)
   */
  async getTasksByProject(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by status for Kanban
    const kanban = {
      todo: tasks.filter(t => t.status === TaskStatus.todo),
      in_progress: tasks.filter(t => t.status === TaskStatus.in_progress),
      review: tasks.filter(t => t.status === TaskStatus.review),
      completed: tasks.filter(t => t.status === TaskStatus.completed),
      cancelled: tasks.filter(t => t.status === TaskStatus.cancelled),
    };

    return kanban;
  }

  /**
   * Get my tasks (for current user)
   */
  async getMyTasks(userId: string) {
    const tasks = await prisma.task.findMany({
      where: { assignedTo: userId },
      include: {
        project: {
          select: {
            id: true,
            projectName: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
        workflowStep: {
          select: {
            stepName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks;
  }

  /**
   * Get task statistics
   */
  async getTaskStats(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const tasks = await prisma.task.findMany({
      where,
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.completed).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.in_progress).length;
    const todoTasks = tasks.filter(t => t.status === TaskStatus.todo).length;
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.completed
    ).length;

    const totalEstimatedHours = tasks.reduce(
      (sum, task) => sum + Number(task.estimatedHours || 0),
      0
    );
    const totalActualHours = tasks.reduce(
      (sum, task) => sum + Number(task.actualHours || 0),
      0
    );

    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      estimatedHours: totalEstimatedHours,
      actualHours: totalActualHours,
    };
  }
}

export const taskService = new TaskService();
