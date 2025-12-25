import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { createUser, getUserById, getUsers } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', authorize(UserRole.manager), createUser);

export default router;
