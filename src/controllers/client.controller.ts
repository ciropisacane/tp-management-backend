// Backend: src/controllers/client.controller.ts
import { Request, Response } from 'express';
import { clientService } from '../services/client.service';
import { asyncHandler } from '../middleware/error.middleware';

class ClientController {
  /**
   * GET /api/clients
   * Get all clients
   */
  getAllClients = asyncHandler(async (req: Request, res: Response) => {
    const { active } = req.query;
    const activeOnly = active === 'true' || active === undefined;

    const clients = await clientService.getAllClients(organizationId, activeOnly);

    res.json({
      success: true,
      data: clients
    });
  });

  /**
   * GET /api/clients/:id
   * Get client by ID
   */
  getClientById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const organizationId = req.user!.organizationId;

    const client = await clientService.getClientById(id, organizationId);

    res.json({
      success: true,
      data: client
    });
  });

  /**
   * POST /api/clients
   * Create new client
   */
  createClient = asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.createClient(req.body);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  });

  /**
   * PUT /api/clients/:id
   * Update client
   */
  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const organizationId = req.user!.organizationId;

    const client = await clientService.updateClient(id, organizationId, req.body);

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  });

  /**
   * DELETE /api/clients/:id
   * Delete client (soft delete)
   */
  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const organizationId = req.user!.organizationId;

    await clientService.deleteClient(id, organizationId);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  });

  /**
   * GET /api/clients/:id/projects
   * Get all projects for a client
   */
  getClientProjects = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const organizationId = req.user!.organizationId;

    const projects = await clientService.getClientProjects(id, organizationId);

    res.json({
      success: true,
      data: projects
    });
  });
}

export const clientController = new ClientController();
