// Backend: src/routes/client.routes.ts
import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateCreateClient, validateUpdateClient } from '../validators/client.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/clients
 * @desc    Get all clients (with optional active filter)
 * @access  Private
 */
router.get('/', clientController.getAllClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Private
 */
router.get('/:id', clientController.getClientById);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private (admin, partner, manager)
 */
router.post('/', validateCreateClient, clientController.createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private (admin, partner, manager)
 */
router.put('/:id', validateUpdateClient, clientController.updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client (soft delete - set active to false)
 * @access  Private (admin, partner)
 */
router.delete('/:id', clientController.deleteClient);

/**
 * @route   GET /api/clients/:id/projects
 * @desc    Get all projects for a client
 * @access  Private
 */
router.get('/:id/projects', clientController.getClientProjects);

export default router;
