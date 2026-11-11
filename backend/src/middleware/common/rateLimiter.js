import rateLimit from 'express-rate-limit';

// Global Limiter: Protects against general traffic floods and basic DDoS attempts
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15-minute window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    // Custom handler to maintain your exact API JSON response format
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }
});

// Strict Limiter: Protects against brute-force/dictionary attacks on sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many attempts from this IP, please try again after 15 minutes.'
    });
  }
});