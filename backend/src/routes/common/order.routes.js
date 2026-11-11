import express from "express";
import { 
  getUserOrderHistory, 
  getUserOrderDetails, 
  trackGuestOrder 
} from "../../controllers/common/order.controller.js";
import { isValidUser } from "../../middleware/common/auth/auth.middleware.js";
import { trackVisit } from "../../middleware/user/trackVisit.middleware.js";

const router = express.Router();

// --- Logged-In User Routes ---
// Requires a valid user token (user_accessToken or user_refreshToken rotation)
router.get("/history", trackVisit, isValidUser, getUserOrderHistory);
router.get("/:orderId", trackVisit, isValidUser, getUserOrderDetails);

// --- Guest Route ---
// Publicly accessible, secured via the Order Number + Email match inside the controller
router.post("/track-guest", trackGuestOrder);

export default router;