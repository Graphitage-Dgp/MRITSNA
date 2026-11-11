import express from 'express';
import {
  getUserDashboardStats,
  getAllUsersAndVisitors,
  getUserFullProfileDetails
} from '../../controllers/admin/admin.user.controller.js';
import { isAdmin } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

// Protect all routes with Admin guard
router.use(isAdmin);

// High-level KPI metrics for Users & Visitors
router.get('/stats', getUserDashboardStats);

// Paginated, filterable list of all Registered Users + Anonymous Visitors
router.get('/', getAllUsersAndVisitors);

// Deep-dive 360° profile (Cart, Wishlist, Orders, Reviews & Ratings)
router.get('/:entityKey', getUserFullProfileDetails);

export default router;
