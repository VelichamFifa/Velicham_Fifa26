import { Router } from 'express';
import { getCommunities, getCommunityById } from '../controllers/communityController';

const router = Router();

// GET /api/communities - For the searchable dropdown
router.get('/', getCommunities);

// GET /api/communities/:id - Get single community by ID
router.get('/:communityId', getCommunityById);

export default router;
