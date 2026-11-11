import express from 'express';
import { getDashboardStats } from '../../controllers/admin/admin.dashboard.controller.js';
import { isAdmin } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();
router.use(isAdmin);

// --- Dashboard Analytics Routes ---
router.get('/stats', getDashboardStats);

export default router;