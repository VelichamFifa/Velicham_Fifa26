import { Router } from 'express';
import { finalizeMatch, getAllUsers, deleteUser } from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes are protected by auth and admin middleware
router.use(authMiddleware, adminMiddleware);

router.get('/users', getAllUsers);
router.post('/finalize-match', finalizeMatch);
router.delete('/users/:userId', deleteUser);

export default router;
