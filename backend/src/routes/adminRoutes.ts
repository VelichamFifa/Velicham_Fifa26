import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
import { archiveMatchPredictions } from '../controllers/matchController';

const router = Router();

// All admin routes require both authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Community Request routes
router.get('/community-requests', adminController.getCommunityRequests);
router.delete('/community-requests/:id', adminController.deleteUserCommunityRequest);

router.post('/approve-community', adminController.approveCommunityRequest);
router.post('/create-and-approve-community', adminController.createAndApproveCommunityRequest);
router.post('/reject-community', adminController.rejectCommunityRequest);

// Community CRUD
router.post('/communities', adminController.createCommunity);
router.put('/communities/:id', adminController.updateCommunity);
router.delete('/communities/:id', adminController.deleteCommunity);

// Match management
router.post('/finalize-match', adminController.finalizeMatch);
router.post('/matches/:matchId/archive', archiveMatchPredictions);

// User management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:userId', adminController.deleteUser);

// Contact Messages
router.get('/contact-messages', adminController.getContactMessages);
router.put('/contact-messages/:id', adminController.updateContactMessageStatus);

export default router;
