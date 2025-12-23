import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUsers, getUserById } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);

export default router;
