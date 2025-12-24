// Projects Routes
import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { teamController } from '../controllers/team.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', authorize('manager', 'partner', 'admin'), projectsController.createProject);
router.get('/', projectsController.getProjects);
router.get('/:id', projectsController.getProjectById);
router.put('/:id', authorize('manager', 'partner', 'admin'), projectsController.updateProject);
router.delete('/:id', authorize('admin', 'partner'), projectsController.deleteProject);

// Project status
router.post('/:id/status', authorize('manager', 'partner', 'admin'), projectsController.changeProjectStatus);

// Workflow
router.get('/:id/workflow', projectsController.getProjectWorkflow);
// Keep progress route before :stepId to avoid route conflicts
router.get('/:id/workflow/progress', projectsController.getWorkflowProgress);
router.put(
  '/:id/workflow/:stepId',
  authorize('manager', 'partner', 'admin'),
  projectsController.updateWorkflowStep
);

// Statistics
router.get('/:id/stats', projectsController.getProjectStats);

// Team management
router.post('/:id/team', authorize('manager', 'partner', 'admin'), projectsController.addTeamMember);
router.delete('/:id/team/:teamMemberId', authorize('manager', 'partner', 'admin'), projectsController.removeTeamMember);
// Get project team
router.get('/:projectId/team', teamController.getProjectTeam);
// Get available users
router.get('/:projectId/team/available', teamController.getAvailableUsers);
// Add team member
router.post('/:projectId/team', teamController.addTeamMember);
// Update team member
router.put('/:projectId/team/:userId', teamController.updateTeamMember);
// Remove team member
router.delete('/:projectId/team/:userId', teamController.removeTeamMember);

export default router;
