import { Router } from 'express';
import { submitPrediction, getUserPredictions, getPredictionAnalytics } from '../controllers/predictionController';

const router = Router();

// GET /api/predictions/analytics - Get aggregated prediction insights
router.get('/analytics', getPredictionAnalytics);

// POST /api/predictions - Submit or update a prediction
router.post('/', submitPrediction);

// GET /api/predictions - Get user's predictions
router.get('/', getUserPredictions);

export default router;
