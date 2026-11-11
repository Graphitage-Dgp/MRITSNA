import express from 'express';
import { 
  getActiveCollections, 
  getCollectionBySlug 
} from '../../controllers/common/collection.controller.js';
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

router.use(trackVisit);
router.use(regionMiddleware);

// ==========================================
// Public Collection Routes
// ==========================================

// Fetch all active collections (e.g., for a "Shop By Collection" landing page)
router.get('/', getActiveCollections);

// Fetch a single active collection by its URL slug (e.g., for the detailed lookbook page)
router.get('/:slug', getCollectionBySlug);

export default router;