// Backend: src/services/team.service.ts
import { PrismaClient, ProjectTeamRole } from '@prisma/client';

const prisma = new PrismaClient();

interface AddTeamMemberDto {
  projectId: string;
  userId: string;
  roleInProject: ProjectTeamRole;
  allocationPercentage: number;
  assignedDate: Date;
}

class TeamService {
  /**
   * Get team members for a project
   */
  async getProjectTeam(projectId: string) {
    const teamMembers = await prisma.projectTeam.findMany({
      where: {
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hourlyRate: true
          }
        }
      },
      orderBy: {
        assignedDate: 'desc'
      }
    });

    return teamMembers;
  }

  /**
   * Add team member to project
   */
  async addTeamMember(data: AddTeamMemberDto) {
    // Check if user is already in project team
    const existingMember = await prisma.projectTeam.findUnique({
      where: {
        projectId_userId: {
          projectId: data.projectId,
          userId: data.userId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this project team');
    }

    // Add team member
    const teamMember = await prisma.projectTeam.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        roleInProject: data.roleInProject,
        allocationPercentage: data.allocationPercentage,
        assignedDate: data.assignedDate
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hourlyRate: true
          }
        }
      }
    });

    return teamMember;
  }

  /**
   * Update team member
   */
  async updateTeamMember(
    projectId: string,
    userId: string,
    data: Partial<Omit<AddTeamMemberDto, 'projectId' | 'userId'>>
  ) {
    const teamMember = await prisma.projectTeam.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hourlyRate: true
          }
        }
      }
    });

    return teamMember;
  }

  /**
   * Remove team member from project
   */
  async removeTeamMember(projectId: string, userId: string) {
    await prisma.projectTeam.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    });
  }

  /**
   * Get available users (not in project team)
   */
  async getAvailableUsers(projectId: string) {
    // Get current team member IDs
    const currentTeam = await prisma.projectTeam.findMany({
      where: { projectId },
      select: { userId: true }
    });

    const currentTeamUserIds = currentTeam.map(tm => tm.userId);

    // Get all active users not in current team
    const availableUsers = await prisma.user.findMany({
      where: {
        active: true,
        id: {
          notIn: currentTeamUserIds
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        hourlyRate: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return availableUsers;
  }
}

export const teamService = new TeamService();
