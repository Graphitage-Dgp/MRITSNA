import express from 'express';
import {
  checkEligibility,
  addReview,
  updateReview,
  getProductReviews,
  getImageKitAuth,
  deleteImageKitFileRoute
} from '../../controllers/common/review.controller.js';

import { optionalAuth } from '../../middleware/common/auth/auth.middleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

router.get('/imagekit/auth', trackVisit, optionalAuth, getImageKitAuth);
router.delete('/imagekit/:fileId', optionalAuth, deleteImageKitFileRoute);

router.get('/product/:slug', trackVisit, optionalAuth, getProductReviews);
router.get('/eligibility/:productId', trackVisit, optionalAuth, checkEligibility);

router.post('/', optionalAuth, addReview);

router.put('/:reviewId', optionalAuth, updateReview);

export default router;