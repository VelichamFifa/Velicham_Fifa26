import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateRequest, schemas } from '../utils/validation';
import * as matchController from '../controllers/matchController';

const router = Router();

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/:matchId', matchController.getMatchById);

// Admin routes (would typically require admin middleware)
router.post('/', authMiddleware, validateRequest(schemas.match), matchController.createMatch);
router.put('/:matchId', authMiddleware, matchController.updateMatch);

export default router;
