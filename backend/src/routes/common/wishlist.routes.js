import express from 'express';
import { 
  getWishlist, 
  toggleWishlistItem, 
  syncWishlist, 
  clearWishlist,
  hydrateGuestWishlist
} from '../../controllers/common/wishlist.controller.js';

import { isValidUser, optionalAuth } from '../../middleware/common/auth/auth.middleware.js'; 
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (For Guests - Hydrates & Persists to DB)
// ==========================================
router.post('/hydrate', optionalAuth, trackVisit, regionMiddleware, hydrateGuestWishlist);

// ==========================================
// PROTECTED ROUTES (For Authenticated Users)
// ==========================================
router.get('/', trackVisit, isValidUser, regionMiddleware, getWishlist);

router.post('/toggle', isValidUser, toggleWishlistItem);
router.post('/sync', isValidUser, regionMiddleware, syncWishlist);
router.delete('/clear', isValidUser, clearWishlist);

export default router;
