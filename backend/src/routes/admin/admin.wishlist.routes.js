import express from 'express';
import {
  getWishlistDashboardStats,
  getAllActiveWishlists,
  getWishlistDetails
} from '../../controllers/admin/admin.wishlist.controller.js';

import { isAdmin } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();


router.use(isAdmin);

router.get('/stats', getWishlistDashboardStats);

router.get('/', getAllActiveWishlists);

router.get('/:wishlistId', getWishlistDetails);

export default router;