// Backend: src/services/dashboard.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(userId: string) {
    // Get total counts
    const [totalProjects, activeProjects, completedProjects, totalClients] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({
        where: {
          status: {
            notIn: ['DELIVERED', 'ARCHIVED']
          }
        }
      }),
      prisma.project.count({
        where: {
          status: 'DELIVERED'
        }
      }),
      prisma.client.count({
        where: { active: true }
      })
    ]);

    // Projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Projects by priority
    const projectsByPriority = await prisma.project.groupBy({
      by: ['priority'],
      _count: {
        priority: true
      }
    });

    // Recent projects
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      }
    });

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = await prisma.project.findMany({
      where: {
        deadline: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        status: {
          notIn: ['DELIVERED', 'ARCHIVED']
        }
      },
      orderBy: {
        deadline: 'asc'
      },
      take: 5,
      include: {
        client: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate days until deadline
    const upcomingDeadlinesWithDays = upcomingDeadlines.map(project => {
      const daysUntilDeadline = project.deadline
        ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: project.id,
        projectName: project.projectName,
        client: project.client,
        deadline: project.deadline,
        daysUntilDeadline
      };
    });

    // Calculate progress for recent projects (simplified)
    const recentProjectsWithProgress = recentProjects.map(project => ({
      id: project.id,
      projectName: project.projectName,
      client: project.client,
      status: project.status,
      priority: project.priority,
      deadline: project.deadline,
      progress: this.calculateProjectProgress(project.status)
    }));

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      projectsByPriority: projectsByPriority.map(item => ({
        priority: item.priority,
        count: item._count.priority
      })),
      recentProjects: recentProjectsWithProgress,
      upcomingDeadlines: upcomingDeadlinesWithDays
    };
  }

  /**
   * Calculate project progress based on status
   */
  private calculateProjectProgress(status: string): number {
    const statusProgress: { [key: string]: number } = {
      'NOT_STARTED': 0,
      'PLANNING': 10,
      'DATA_GATHERING': 25,
      'ANALYSIS': 40,
      'DRAFTING': 60,
      'INTERNAL_REVIEW': 75,
      'CLIENT_REVIEW': 85,
      'FINALIZATION': 95,
      'DELIVERED': 100,
      'ARCHIVED': 100,
      'ON_HOLD': 50,
      'WAITING_CLIENT': 50,
      'WAITING_THIRD_PARTY': 50,
      'REVISION_REQUIRED': 70
    };

    return statusProgress[status] || 0;
  }

  /**
   * Get user activity (time entries, tasks completed, etc.)
   */
  async getActivity(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [timeEntries, tasksCompleted, documentsUploaded] = await Promise.all([
      prisma.timeEntry.aggregate({
        where: {
          userId,
          date: {
            gte: startDate
          }
        },
        _sum: {
          hours: true
        }
      }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          completedAt: {
            gte: startDate
          }
        }
      }),
      prisma.document.count({
        where: {
          uploadedBy: userId,
          createdAt: {
            gte: startDate
          }
        }
      })
    ]);

    return {
      totalHours: timeEntries._sum.hours || 0,
      tasksCompleted,
      documentsUploaded,
      period: `Last ${days} days`
    };
  }
}

export const dashboardService = new DashboardService();
