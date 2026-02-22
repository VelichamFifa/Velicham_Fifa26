import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// All admin routes require both authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Community Request routes
router.get('/community-requests', adminController.getCommunityRequests);
router.post('/approve-community', adminController.approveCommunityRequest);
router.post('/create-and-approve-community', adminController.createAndApproveCommunityRequest);

// Match management
router.post('/finalize-match', adminController.finalizeMatch);

// User management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:userId', adminController.deleteUser);

export default router;
