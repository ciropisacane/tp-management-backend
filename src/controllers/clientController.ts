// Backend: src/controllers/clientController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private
 */
export const getAllClients = async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    
    const where = active === 'true' || active === undefined 
      ? { active: true } 
      : {};

    const clients = await prisma.client.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: clients
    });
  } catch (error: any) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error.message
    });
  }
};

/**
 * @desc    Get client by ID
 * @route   GET /api/clients/:id
 * @access  Private
 */
export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error: any) {
    logger.error('Error fetching client:', error);
    res.status(500).json({
      error: 'Failed to fetch client',
      message: error.message
    });
  }
};

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private
 */
export const createClient = async (req: Request, res: Response) => {
  try {
    const {
      name,
      industry,
      country,
      contactName,
      contactEmail,
      contactPhone,
      billingAddress,
      notes
    } = req.body;

    // Check if client with same name already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingClient) {
      return res.status(400).json({
        error: 'Client with this name already exists'
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        industry,
        country,
        contactName,
        contactEmail,
        contactPhone,
        billingAddress,
        notes,
        active: true
      }
    });

    logger.info(`Client created: ${client.name} (${client.id})`);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating client:', error);
    res.status(500).json({
      error: 'Failed to create client',
      message: error.message
    });
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private
 */
export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      industry,
      country,
      contactName,
      contactEmail,
      contactPhone,
      billingAddress,
      notes,
      active
    } = req.body;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Check if name is being changed to an existing name
    if (name && name !== existingClient.name) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          },
          id: {
            not: id
          }
        }
      });

      if (duplicateClient) {
        return res.status(400).json({
          error: 'Client with this name already exists'
        });
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(industry !== undefined && { industry }),
        ...(country !== undefined && { country }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(notes !== undefined && { notes }),
        ...(active !== undefined && { active })
      }
    });

    logger.info(`Client updated: ${client.name} (${client.id})`);

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating client:', error);
    res.status(500).json({
      error: 'Failed to update client',
      message: error.message
    });
  }
};

/**
 * @desc    Delete client (soft delete)
 * @route   DELETE /api/clients/:id
 * @access  Private
 */
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Check if client has active projects
    const activeProjects = await prisma.project.count({
      where: {
        clientId: id,
        status: {
          notIn: ['DELIVERED', 'ARCHIVED']
        }
      }
    });

    if (activeProjects > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with active projects',
        message: `This client has ${activeProjects} active project(s). Please complete or archive them first.`
      });
    }

    // Soft delete - set active to false
    const client = await prisma.client.update({
      where: { id },
      data: {
        active: false
      }
    });

    logger.info(`Client deleted (soft): ${client.name} (${client.id})`);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting client:', error);
    res.status(500).json({
      error: 'Failed to delete client',
      message: error.message
    });
  }
};

/**
 * @desc    Get all projects for a client
 * @route   GET /api/clients/:id/projects
 * @access  Private
 */
export const getClientProjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        clientId: id
      },
      include: {
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            projectTeam: true,
            tasks: true,
            documents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error: any) {
    logger.error('Error fetching client projects:', error);
    res.status(500).json({
      error: 'Failed to fetch client projects',
      message: error.message
    });
  }
};
