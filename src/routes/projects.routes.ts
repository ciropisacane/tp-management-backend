// Projects Routes
import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
// import { teamController } from '../controllers/team.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', authorize('manager', 'partner', 'admin'), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', authorize('manager', 'partner', 'admin'), projectController.updateProject);
router.delete('/:id', authorize('admin', 'partner'), projectController.deleteProject);

// Project status
router.post('/:id/status', authorize('manager', 'partner', 'admin'), projectController.changeProjectStatus);

// Workflow
router.get('/:id/workflow', projectController.getProjectWorkflow);
router.get('/:id/workflow/progress', projectController.getWorkflowProgress);
router.put(
  '/:id/workflow/:stepId',
  authorize('manager', 'partner', 'admin'),
  projectController.updateWorkflowStep
);

// Statistics
router.get('/:id/stats', projectController.getProjectStats);

// Team management
router.post('/:id/team', authorize('manager', 'partner', 'admin'), projectController.addTeamMember);
router.delete('/:id/team/:teamMemberId', authorize('manager', 'partner', 'admin'), projectController.removeTeamMember);
// Get project team
// router.get('/:projectId/team', teamController.getProjectTeam);
// Get available users
// router.get('/:projectId/team/available', teamController.getAvailableUsers);
// Add team member
// router.post('/:projectId/team', teamController.addTeamMember);
// Update team member
// router.put('/:projectId/team/:userId', teamController.updateTeamMember);
// Remove team member
// router.delete('/:projectId/team/:userId', teamController.removeTeamMember);

export default router;
