import express from "express";
import parser from "cookie-parser";
import cors from "cors";

// Custom Middlewares & Utils
import { globalLimiter } from "./middleware/common/rateLimiter.js";

// Routes
import adminAuthRoutes from "./routes/admin/admin.auth.routes.js";
import adminDashboardRoutes from "./routes/admin/admin.dashboard.routes.js";
import adminProductRoutes from './routes/admin/admin.product.routes.js';
import adminCartRoutes from './routes/admin/admin.cart.routes.js';
import adminWishlistRoutes from './routes/admin/admin.wishlist.routes.js';
import adminCouponRoutes from './routes/admin/admin.coupon.routes.js';
import adminOrderRoutes from './routes/admin/admin.order.routes.js';
import adminReviewRoutes from './routes/admin/admin.review.routes.js';
import adminCollectionRoutes from './routes/admin/admin.collection.routes.js';
import adminUserRoutes from './routes/admin/admin.user.routes.js';

import authRouter from "./routes/common/auth.routes.js";
import productRoutes from './routes/common/product.routes.js';
import cartRoutes from './routes/common/cart.routes.js';
import wishlistRoutes from './routes/common/wishlist.routes.js';
import checkoutRoutes from './routes/common/checkout.routes.js';
import regionRoutes from './routes/common/region.routes.js';
import orderRoutes from './routes/common/order.routes.js';
import addressRoutes from './routes/common/address.routes.js';
import webhookRoutes from './routes/common/webhook.routes.js';
import reviewRoutes from './routes/common/review.routes.js';
import collectionRoutes from './routes/common/collection.routes.js';

const app = express();

// Trust Proxy (Crucial for Rate Limiters behind Load Balancers/Render)
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Dynamic CORS (registered before rate limiting/body parsing so preflights always get CORS headers)
const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.ADMIN_FRONTEND_URL),
  ...parseOrigins(process.env.SUB_FRONTEND_URL),
];

console.log("[CORS] Allowed origins:", allowedOrigins.length ? allowedOrigins : "(none configured)");

app.use(
  cors({
    origin: function (origin, callback) {
      const normalizedOrigin = origin ? origin.replace(/\/+$/, "") : origin;
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Webhook Specific Parser
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));
app.use('/api/v1/webhooks', webhookRoutes);

// Standard Body Parsers & Cookies
app.use(express.json({ limit: "2mb" })); 
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(parser());

// GLOBAL RATE LIMITER
app.use(globalLimiter);

// ROUTES
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy." });
});

// Admin Routes
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/carts', adminCartRoutes);
app.use('/api/v1/admin/wishlists', adminWishlistRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/admin/collections', adminCollectionRoutes);
app.use('/api/v1/admin/users', adminUserRoutes);

// Public Routes
app.use("/api/v1/auth", authRouter);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/region', regionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/collections', collectionRoutes);

// Global Catch-All Error Handler
app.use((err, req, res, next) => {
  console.error("[Global Error]:", err.message || err);
  
  if (err.message?.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ success: false, message: `CORS Error: ${err.message}` });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
