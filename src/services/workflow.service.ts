// Workflow Management Service
import { prisma } from '../config/database';
import { DeliverableType, WorkflowStepStatus, ProjectStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

class WorkflowService {
  /**
   * Create workflow steps for a project based on deliverable type
   */
  async createProjectWorkflow(projectId: string, deliverableType: DeliverableType) {
    try {
      // Get workflow templates for this deliverable type
      const templates = await prisma.workflowTemplate.findMany({
        where: { deliverableType: deliverableType.toString() },
        orderBy: { stepSequence: 'asc' },
      });

      if (templates.length === 0) {
        console.warn(`No workflow templates found for deliverable type: ${deliverableType}`);
        return;
      }

      // Create workflow steps from templates
      const workflowSteps = templates.map(template => ({
        projectId,
        workflowTemplateId: template.id,
        stepSequence: template.stepSequence,
        stepName: template.stepName,
        status: WorkflowStepStatus.not_started,
        completionPercentage: 0,
      }));

      await prisma.projectWorkflow.createMany({
        data: workflowSteps,
      });

      console.log(`Created ${workflowSteps.length} workflow steps for project ${projectId}`);
    } catch (error) {
      console.error('Error creating project workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow steps for a project
   */
  async getProjectWorkflow(projectId: string) {
    const workflow = await prisma.projectWorkflow.findMany({
      where: { projectId },
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
    });

    return workflow;
  }

  /**
   * Update workflow step
   */
  async updateWorkflowStep(
    stepId: string,
    data: {
      status?: WorkflowStepStatus;
      assignedTo?: string;
      completionPercentage?: number;
      notes?: string;
      startDate?: Date;
      dueDate?: Date;
    }
  ) {
    const step = await prisma.projectWorkflow.findUnique({
      where: { id: stepId },
      include: { project: true },
    });

    if (!step) {
      throw new NotFoundError('Workflow step not found');
    }

    // If marking as completed, validate prerequisites
    if (data.status === WorkflowStepStatus.completed) {
      await this.validateStepCompletion(stepId, step.projectId);
      data.completionPercentage = 100;

      // Set completion date
      const updatedStep = await prisma.projectWorkflow.update({
        where: { id: stepId },
        data: {
          ...data,
          completionDate: new Date(),
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
        },
      });

      // Update project status if all steps completed
      await this.updateProjectStatusIfNeeded(step.projectId);

      return updatedStep;
    }

    // If starting step, set start date
    if (data.status === WorkflowStepStatus.in_progress && !step.startDate) {
      return await prisma.projectWorkflow.update({
        where: { id: stepId },
        data: {
          ...data,
          startDate: new Date(),
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
        },
      });
    }

    return await prisma.projectWorkflow.update({
      where: { id: stepId },
      data,
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
    });
  }

  /**
   * Validate that prerequisites are met before completing a step
   */
  private async validateStepCompletion(stepId: string, projectId: string) {
    const currentStep = await prisma.projectWorkflow.findUnique({
      where: { id: stepId },
    });

    if (!currentStep) {
      throw new NotFoundError('Workflow step not found');
    }

    // Get all previous steps
    const previousSteps = await prisma.projectWorkflow.findMany({
      where: {
        projectId,
        stepSequence: { lt: currentStep.stepSequence },
      },
    });

    // Check if all previous steps are completed
    const incompleteSteps = previousSteps.filter(
      step => step.status !== WorkflowStepStatus.completed
    );

    if (incompleteSteps.length > 0) {
      throw new ValidationError(
        `Cannot complete this step. Previous steps must be completed first: ${incompleteSteps.map(s => s.stepName).join(', ')}`
      );
    }
  }

  /**
   * Update project status based on workflow progress
   */
  private async updateProjectStatusIfNeeded(projectId: string) {
    const workflow = await prisma.projectWorkflow.findMany({
      where: { projectId },
    });

    const allCompleted = workflow.every(
      step => step.status === WorkflowStepStatus.completed
    );

    if (allCompleted) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.DELIVERED },
      });
    } else {
      // Calculate overall completion percentage
      const totalPercentage = workflow.reduce(
        (sum, step) => sum + step.completionPercentage,
        0
      );
      const avgCompletion = totalPercentage / workflow.length;

      // Update project status based on average completion
      let newStatus = ProjectStatus.PLANNING;
      if (avgCompletion >= 75) {
        newStatus = ProjectStatus.FINALIZATION;
      } else if (avgCompletion >= 50) {
        newStatus = ProjectStatus.INTERNAL_REVIEW;
      } else if (avgCompletion >= 25) {
        newStatus = ProjectStatus.DRAFTING;
      } else if (avgCompletion > 0) {
        newStatus = ProjectStatus.ANALYSIS;
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { status: newStatus },
      });
    }
  }

  /**
   * Get workflow progress statistics
   */
  async getWorkflowProgress(projectId: string) {
    const workflow = await prisma.projectWorkflow.findMany({
      where: { projectId },
    });

    const totalSteps = workflow.length;
    const completedSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.completed
    ).length;
    const inProgressSteps = workflow.filter(
      step => step.status === WorkflowStepStatus.in_progress
    ).length;

    const totalPercentage = workflow.reduce(
      (sum, step) => sum + step.completionPercentage,
      0
    );
    const overallCompletion = totalSteps > 0 ? totalPercentage / totalSteps : 0;

    return {
      totalSteps,
      completedSteps,
      inProgressSteps,
      overallCompletion: Math.round(overallCompletion),
      completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
    };
  }
}

// IMPORTANTE: Esporta una ISTANZA della classe
export const workflowService = new WorkflowService();