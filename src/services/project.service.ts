// Project Service - Business Logic
import { prisma } from '../config/database';
import { DeliverableType, ProjectStatus, Priority, RiskLevel, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { workflowService } from './workflow.service';

export interface CreateProjectInput {
  clientId: string;
  projectName: string;
  deliverableType: DeliverableType;
  description?: string;
  startDate?: Date;
  deadline?: Date;
  estimatedHours?: number;
  budget?: number;
  projectManagerId: string;
  priority?: Priority;
  riskLevel?: RiskLevel;
  teamMembers?: {
    userId: string;
    roleInProject: string;
    allocationPercentage: number;
  }[];
}

export interface UpdateProjectInput {
  projectName?: string;
  description?: string;
  startDate?: Date;
  deadline?: Date;
  estimatedHours?: number;
  budget?: number;
  projectManagerId?: string;
  priority?: Priority;
  riskLevel?: RiskLevel;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  clientId?: string;
  deliverableType?: DeliverableType;
  status?: ProjectStatus;
  priority?: Priority;
  projectManagerId?: string;
  teamMemberId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProjectService {
  /**
   * Create a new project with workflow
   */
  async createProject(input: CreateProjectInput, createdBy: string) {
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new ValidationError('Client not found');
    }

    // Validate project manager exists
    const projectManager = await prisma.user.findUnique({
      where: { id: input.projectManagerId },
    });

    if (!projectManager) {
      throw new ValidationError('Project manager not found');
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        clientId: input.clientId,
        projectName: input.projectName,
        deliverableType: input.deliverableType,
        description: input.description,
        startDate: input.startDate,
        deadline: input.deadline,
        estimatedHours: input.estimatedHours,
        budget: input.budget,
        projectManagerId: input.projectManagerId,
        priority: input.priority || Priority.medium,
        riskLevel: input.riskLevel || RiskLevel.medium,
        status: ProjectStatus.NOT_STARTED,
        actualHours: 0,
        actualCost: 0,
      },
      include: {
        client: true,
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Add project manager to team
    await prisma.projectTeam.create({
      data: {
        projectId: project.id,
        userId: input.projectManagerId,
        roleInProject: 'project_manager',
        allocationPercentage: 100,
        assignedDate: new Date(),
      },
    });

    // Add additional team members if provided
    if (input.teamMembers && input.teamMembers.length > 0) {
      await prisma.projectTeam.createMany({
        data: input.teamMembers.map(member => ({
          projectId: project.id,
          userId: member.userId,
          roleInProject: member.roleInProject as any,
          allocationPercentage: member.allocationPercentage,
          assignedDate: new Date(),
        })),
      });
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId: createdBy,
        actionType: 'created',
        entityType: 'project',
        entityId: project.id,
        description: `Created project: ${project.projectName}`,
      },
    });

    return project;
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(projectId: string, userId: string, userRole: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        projectTeam: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                hourlyRate: true,
              },
            },
          },
        },
        workflow: {
          orderBy: { stepSequence: 'asc' },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            reviews: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check access permissions (unless admin/partner)
    if (userRole !== 'admin' && userRole !== 'partner') {
      const isTeamMember = project.projectTeam.some(
        member => member.userId === userId
      );

      if (!isTeamMember && project.projectManagerId !== userId) {
        throw new ForbiddenError('You do not have access to this project');
      }
    }

    return project;
  }

  /**
   * Get all projects with filters and pagination
   */
  async getProjects(
    filters: ProjectFilters,
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
    const where: Prisma.ProjectWhereInput = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.deliverableType) {
      where.deliverableType = filters.deliverableType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.projectManagerId) {
      where.projectManagerId = filters.projectManagerId;
    }

    if (filters.teamMemberId) {
      where.projectTeam = {
        some: {
          userId: filters.teamMemberId,
        },
      };
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {
        ...(filters.startDateFrom && { gte: filters.startDateFrom }),
        ...(filters.startDateTo && { lte: filters.startDateTo }),
      };
    }

    if (filters.deadlineFrom || filters.deadlineTo) {
      where.deadline = {
        ...(filters.deadlineFrom && { gte: filters.deadlineFrom }),
        ...(filters.deadlineTo && { lte: filters.deadlineTo }),
      };
    }

    if (filters.search) {
      where.OR = [
        { projectName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Apply row-level security (non-admin users see only their projects)
    if (userRole !== 'admin' && userRole !== 'partner') {
      where.OR = [
        { projectManagerId: userId },
        {
          projectTeam: {
            some: {
              userId: userId,
            },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        client: true,
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        projectTeam: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
          },
        },
      },
    });

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, input: UpdateProjectInput, userId: string) {
    // Check project exists and user has permission
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectTeam: true,
      },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: input,
      include: {
        client: true,
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId,
        actionType: 'updated',
        entityType: 'project',
        entityId: project.id,
        description: `Updated project: ${project.projectName}`,
      },
    });

    return project;
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Soft delete by changing status to ARCHIVED
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ARCHIVED },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId,
        userId,
        actionType: 'deleted',
        entityType: 'project',
        entityId: projectId,
        description: `Archived project: ${project.projectName}`,
      },
    });

    return { message: 'Project archived successfully' };
  }

  /**
   * Change project status
   */
  async changeProjectStatus(projectId: string, status: ProjectStatus, userId: string) {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId,
        userId,
        actionType: 'status_changed',
        entityType: 'project',
        entityId: projectId,
        description: `Changed project status to: ${status}`,
      },
    });

    return project;
  }

  /**
   * Add team member to project
   */
  async addTeamMember(
    projectId: string,
    userId: string,
    roleInProject: string,
    allocationPercentage: number
  ) {
    // Check if user is already in team
    const existing = await prisma.projectTeam.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (existing) {
      throw new ValidationError('User is already a team member');
    }

    const teamMember = await prisma.projectTeam.create({
      data: {
        projectId,
        userId,
        roleInProject: roleInProject as any,
        allocationPercentage,
        assignedDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return teamMember;
  }

  /**
   * Remove team member from project
   */
  async removeTeamMember(projectId: string, teamMemberId: string) {
    await prisma.projectTeam.delete({
      where: {
        id: teamMemberId,
      },
    });

    return { message: 'Team member removed successfully' };
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        timeEntries: true,
        documents: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Calculate task statistics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = project.tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    // Calculate time statistics
    const totalHours = project.timeEntries.reduce(
      (sum, entry) => sum + Number(entry.hours),
      0
    );
    const billableHours = project.timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + Number(entry.hours), 0);

    // Calculate budget statistics
    const budgetUsed = (totalHours / (project.estimatedHours || 1)) * 100;

    // Get workflow progress
    const workflowProgress = await workflowService.getWorkflowProgress(projectId);

    return {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      time: {
        estimated: project.estimatedHours || 0,
        actual: totalHours,
        billable: billableHours,
        remaining: (project.estimatedHours || 0) - totalHours,
      },
      budget: {
        estimated: Number(project.budget || 0),
        actual: Number(project.actualCost || 0),
        percentageUsed: budgetUsed,
      },
      documents: {
        total: project.documents.length,
      },
      workflow: workflowProgress,
    };
  }
}

export const projectService = new ProjectService();
