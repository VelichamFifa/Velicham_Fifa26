import { Router } from 'express';
import { getCommunities, getCommunityById, getCommunityMembers } from '../controllers/communityController';

const router = Router();

// GET /api/communities - For the searchable dropdown
router.get('/', getCommunities);

// GET /api/communities/:communityId/members - Get all members of a community
router.get('/:communityId/members', getCommunityMembers);

// GET /api/communities/:communityId - Get single community by ID
router.get('/:communityId', getCommunityById);

export default router;
