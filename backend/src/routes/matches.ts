import { createMatch, finalizeMatch, getMatches } from '../controllers/matchController';
import { Router } from 'express';
const router = Router();

// GET /api/matches - List all matches
router.get('/', getMatches);

// POST /api/matches - Create election categories (Admin)
router.post('/', createMatch);

// POST /api/matches/finalize - Input official results and trigger point calculation (Admin)
router.post('/finalize', finalizeMatch);

export default router;
