import express from "express";
import { 
  fulfillOrder, 
  getAllOrders, 
  updateOrderStatus,
  exportOrders,
  getOrderById
} from "../../controllers/admin/admin.order.controller.js";
import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

// Fetch all paginated orders
router.get("/", isAdmin, getAllOrders);

// Export to CSV
router.get("/export", isAdmin, exportOrders);

// Fetch details for a specific order
router.get("/:orderId", isAdmin, getOrderById);

// Update order status manually
router.patch("/:orderId/status", isAdmin, updateOrderStatus);

// Fulfill via Delhivery
router.post("/:orderId/fulfill", isAdmin, fulfillOrder);

export default router;