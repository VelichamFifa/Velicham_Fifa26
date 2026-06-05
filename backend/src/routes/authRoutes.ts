import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateRequest, schemas } from '../utils/validation';
import * as authController from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);
router.post('/google', validateRequest(schemas.googleLogin), authController.googleLogin);
router.post('/contact', authController.submitContactMessage);

// Protected routes
router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/profile', authMiddleware, validateRequest(schemas.updateProfile), authController.updateUserProfile);
router.post('/profile/community-requests', authMiddleware, authController.submitCommunityRequest);
router.get('/profile/community-requests', authMiddleware, authController.getUserCommunityRequests);
router.put('/profile/community-requests/:id', authMiddleware, authController.updateUserCommunityRequest);
router.delete('/profile/community-requests/:id', authMiddleware, authController.deleteUserCommunityRequest);

export default router;
