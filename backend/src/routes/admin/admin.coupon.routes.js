import express from 'express';
import {
  getCouponDashboardStats,
  getAllCoupons,
  getCouponDetails,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon
} from '../../controllers/admin/admin.coupon.controller.js';

import { isAdmin } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

// ==========================================
// ADMIN COUPON ROUTES
// Base Route: /api/v1/admin/coupons (Assuming this is how you mount it in app.js)
// ==========================================

// Protect all routes: only admins can manage coupons
router.use(isAdmin);

// GET DASHBOARD METRICS
// Returns total active, expired, and top used coupons.
// Endpoint: GET /api/v1/admin/coupons/stats
router.get('/stats', getCouponDashboardStats);

// GET PAGINATED LIST
// Returns the table view of all coupons, supporting pagination and filters.
// Endpoint: GET /api/v1/admin/coupons?page=1&limit=15&filter=active
router.get('/', getAllCoupons);

// GET DEEP-DIVE DETAILS
// Returns specific details of a coupon, including populated referenced products and users.
// Endpoint: GET /api/v1/admin/coupons/:id
router.get('/:id', getCouponDetails);

// CREATE NEW COUPON
// Generates a new discount code based on the provided payload.
// Endpoint: POST /api/v1/admin/coupons
router.post('/', createCoupon);

// UPDATE EXISTING COUPON
// Updates the rules, dates, or values of a specific coupon.
// Endpoint: PUT /api/v1/admin/coupons/:id
router.put('/:id', updateCoupon);

// TOGGLE STATUS (KILL SWITCH)
// Instantly pauses or reactivates a coupon without deleting its history.
// Endpoint: PATCH /api/v1/admin/coupons/:id/toggle
router.patch('/:id/toggle', toggleCouponStatus);

// PERMANENT DELETE
// Completely removes a coupon from the database.
// Endpoint: DELETE /api/v1/admin/coupons/:id
router.delete('/:id', deleteCoupon);

export default router;