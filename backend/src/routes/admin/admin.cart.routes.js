import express from 'express';
import {
  getCartDashboardStats,
  getAllActiveCarts,
  getCartDetails,
  adminClearUserCart,
  triggerAbandonedCartEmail
} from '../../controllers/admin/admin.cart.controller.js';

import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

// ==========================================
// SECURITY GUARD: ADMIN ONLY
// ==========================================
router.use(isAdmin); // All routes below this line require a valid admin_accessToken

// ==========================================
// CART DASHBOARD ROUTES
// ==========================================

// Get high-level metrics for the top of the dashboard
// MUST be placed above /:cartId so Express doesn't treat 'stats' as an ID
router.get('/stats', getCartDashboardStats);

// Fetch the paginated, filterable list of all active user carts
router.get('/', getAllActiveCarts);

// ==========================================
// INDIVIDUAL CART ROUTES
// ==========================================

// Fetch deep-dive details for a specific cart (User info + Variants)
router.get('/:cartId', getCartDetails);

// Admin Override: Force clear a user's cart (releases inventory bottleneck)
router.delete('/:cartId/clear', adminClearUserCart);

// Action: Trigger an abandoned cart email reminder
router.post('/:cartId/remind', triggerAbandonedCartEmail);

export default router;