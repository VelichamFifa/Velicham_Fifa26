import { createMatch, finalizeMatch, getMatches, getMatchById } from '../controllers/matchController';
import { Router } from 'express';
const router = Router();

// GET /api/matches - List all matches
router.get('/', getMatches);

// POST /api/matches - Create election categories (Admin)
router.post('/', createMatch);

// GET /api/matches/:matchId - Get single match by ID
router.get('/:matchId', getMatchById);

// POST /api/matches/finalize - Input official results and trigger point calculation (Admin)
router.post('/finalize', finalizeMatch);

export default router;
