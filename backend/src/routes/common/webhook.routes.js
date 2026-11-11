import express from "express";
import { handleDelhiveryWebhook, handleRazorpayWebhook } from "../../controllers/common/webhook.controller.js";

const router = express.Router();

// Route: POST /api/webhooks/delhivery
// This is completely public so Delhivery can reach it.
router.post("/delhivery", handleDelhiveryWebhook);

router.post("/razorpay", handleRazorpayWebhook);

export default router;