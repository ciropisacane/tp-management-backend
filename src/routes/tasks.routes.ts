// Tasks Routes
import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my tasks (must be before /:id to avoid conflicts)
router.get('/my/all', tasksController.getMyTasks);

// Task statistics
router.get('/stats', tasksController.getTaskStats);

// Task CRUD
router.post('/', authorize('manager', 'senior', 'partner', 'admin'), tasksController.createTask);
router.get('/', tasksController.getTasks);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', authorize('manager', 'partner', 'admin'), tasksController.deleteTask);

export default router;
