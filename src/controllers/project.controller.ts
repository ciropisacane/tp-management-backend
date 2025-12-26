
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error.middleware';

const prisma = new PrismaClient();

class ProjectController {

    // Create Project
    createProject = asyncHandler(async (req: Request, res: Response) => {
        const { clientId, projectName, deliverableType, priority, estimatedHours, budget, projectManagerId, description } = req.body;
        const organizationId = req.user!.organizationId;

        const project = await prisma.project.create({
            data: {
                organizationId,
                clientId,
                projectName,
                deliverableType,
                priority,
                estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
                budget: budget ? parseFloat(budget) : undefined,
                projectManagerId, // Ensure this user belongs to org? Frontend should filter.
                description
            }
        });

        res.status(201).json({ success: true, data: project });
    });

    // Get All Projects (Filtered by Org)
    getProjects = asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;

        const projects = await prisma.project.findMany({
            where: { organizationId },
            include: {
                client: true,
                projectManager: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({ success: true, data: projects });
    });

    // Get Project By ID
    getProjectById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                projectManager: true,
                tasks: true,
                workflow: {
                    include: { assignee: true }
                }
            }
        });

        if (!project || project.organizationId !== organizationId) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.json({ success: true, data: project });
    });

    // Update Project
    updateProject = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;

        // Verify ownership
        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        const updated = await prisma.project.update({
            where: { id },
            data: req.body
        });

        res.json({ success: true, data: updated });
    });

    // Delete Project
    deleteProject = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;

        // Verify ownership
        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        await prisma.project.delete({ where: { id } });

        res.json({ success: true, message: 'Project deleted' });
    });

    // Add more methods as placeholders if needed by routes, or remove routes that use them
    changeProjectStatus = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    getProjectWorkflow = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    getWorkflowProgress = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    updateWorkflowStep = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    getProjectStats = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    addTeamMember = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
    removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
        res.status(501).json({ message: "Not implemented" });
    });
}

export const projectController = new ProjectController();
