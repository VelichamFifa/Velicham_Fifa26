import { Router } from 'express';
import { submitPrediction, getUserPredictions } from '../controllers/predictionController';

const router = Router();

// POST /api/predictions - Submit or update a prediction
router.post('/', submitPrediction);

// GET /api/predictions - Get user's predictions
router.get('/', getUserPredictions);

export default router;
