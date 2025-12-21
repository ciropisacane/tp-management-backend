// Backend: src/services/client.service.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateClientDto {
  name: string;
  industry?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
  notes?: string;
}

interface UpdateClientDto extends Partial<CreateClientDto> {
  active?: boolean;
}

class ClientService {
  /**
   * Get all clients
   */
  async getAllClients(activeOnly: boolean = true) {
    const where = activeOnly ? { active: true } : {};

    return await prisma.client.findMany({
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
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string) {
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
      throw new Error('Client not found');
    }

    return client;
  }

  /**
   * Create new client
   */
  async createClient(data: CreateClientDto) {
    // Check if client with same name already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingClient) {
      throw new Error('Client with this name already exists');
    }

    return await prisma.client.create({
      data: {
        ...data,
        active: true
      }
    });
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: UpdateClientDto) {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if name is being changed to an existing name
    if (data.name && data.name !== existingClient.name) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive'
          },
          id: {
            not: id
          }
        }
      });

      if (duplicateClient) {
        throw new Error('Client with this name already exists');
      }
    }

    return await prisma.client.update({
      where: { id },
      data
    });
  }

  /**
   * Delete client (soft delete)
   */
  async deleteClient(id: string) {
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
      throw new Error('Client not found');
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
      throw new Error(
        `Cannot delete client with ${activeProjects} active project(s). Please complete or archive them first.`
      );
    }

    // Soft delete - set active to false
    return await prisma.client.update({
      where: { id },
      data: {
        active: false
      }
    });
  }

  /**
   * Get all projects for a client
   */
  async getClientProjects(id: string) {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return await prisma.project.findMany({
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
  }
}

export const clientService = new ClientService();
