import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateRequest, schemas } from '../utils/validation';
import * as matchController from '../controllers/matchController';

const router = Router();

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/:matchId', matchController.getMatchById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, validateRequest(schemas.match), matchController.createMatch);
router.put('/:matchId', authMiddleware, adminMiddleware, matchController.updateMatch);

export default router;
