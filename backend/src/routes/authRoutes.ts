import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateRequest, schemas } from '../utils/validation';
import * as authController from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/profile', authMiddleware, authController.updateUserProfile);

export default router;
