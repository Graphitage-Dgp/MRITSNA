import express from 'express';
import {
  getAdminReviewSummary,
  getAdminProductReviews,
  updateReviewStatus,
  adminAddReview
} from '../../controllers/admin/admin.review.controller.js';

import { isAdmin } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

// Enforce isAdmin on all routes in this file natively
router.use(isAdmin);

// Get the high-level dashboard summary (List of products & review counts)
router.get('/summary', getAdminReviewSummary);

// Get all reviews for a specific product (with sorting & filtering)
router.get('/product/:productId', getAdminProductReviews);

// Approve or Reject a review
router.put('/:reviewId/status', updateReviewStatus);

// Manually seed a review bypassing order requirements
router.post('/seed', adminAddReview);

export default router;