import express from "express";
import { 
  adminSignIn, 
  adminVerifyOTP, 
  adminLogout, 
  getAdminProfile, 
  adminResendOTP
} from "../../controllers/admin/admin.auth.controller.js";

// === FIX: Import isAdmin instead of isValidUser ===
import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";
import { strictLimiter } from "../../middleware/common/rateLimiter.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Authentication Phase)
// ==========================================

// Step 1: Submit email and password to receive OTP
router.post("/signin", strictLimiter, adminSignIn);

router.post("/resend-otp", strictLimiter, adminResendOTP);

// Step 2: Submit email and OTP to establish a secure session
router.post("/verify", strictLimiter, adminVerifyOTP);

// ==========================================
// PROTECTED ROUTES (Requires Active Session)
// ==========================================

// Retrieve the admin profile (used to validate session on frontend load)
router.get("/profile", isAdmin, getAdminProfile);

// Securely terminate the session and clear cookies
router.post("/logout", isAdmin, adminLogout);

export default router;