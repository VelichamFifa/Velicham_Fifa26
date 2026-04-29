import { Router } from 'express';
import { getCommunities, getCommunityById } from '../controllers/communityController';

const router = Router();

router.get('/', getCommunities);
router.get('/:communityId', getCommunityById);

export default router;
