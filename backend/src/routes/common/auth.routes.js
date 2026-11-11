import express from "express";
import { 
  checkAuth,
  register, 
  login, 
  logout, 
  logoutAllOtherDevices, 
  deactivateAccount, 
  sendVerificationEmail, 
  verifyEmail, 
  changeEmailAndResendOtp
} from "../../controllers/common/auth.controller.js";
import { isValidUser, optionalAuth } from "../../middleware/common/auth/auth.middleware.js";
import { validateLogin, validateRegister } from "../../middleware/user/auth.validation.js";
import { strictLimiter } from "../../middleware/common/rateLimiter.js";
import { trackVisit } from "../../middleware/user/trackVisit.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Uses optionalAuth so guests get a persistent device_id cookie and a clean 200 { user: null } response
router.get("/check-auth", optionalAuth, trackVisit, checkAuth);

// Handles both brand new users and Guests claiming their Silent Accounts
router.post("/register", strictLimiter, validateRegister, register);

// Establishes the 30-day absolute session
router.post("/login", strictLimiter, validateLogin, login);


// ==========================================
// PROTECTED VIP ROUTES (Requires Valid Access/Refresh Tokens)
// ==========================================

router.post("/logout", isValidUser, logout);
router.post("/logout-all", isValidUser, logoutAllOtherDevices);
router.post("/deactivate", isValidUser, deactivateAccount);
router.post("/send-verification", strictLimiter, isValidUser, sendVerificationEmail);
router.post("/verify-email", strictLimiter, isValidUser, verifyEmail);
router.post("/change-email", strictLimiter, isValidUser, changeEmailAndResendOtp);

export default router;
