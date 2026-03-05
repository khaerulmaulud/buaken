import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for review creation
 * Limits: 5 reviews per 15 minutes per IP
 */
export const reviewCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 reviews per window
  message: 'Too many reviews created. Please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many reviews created. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter for image uploads
 * Limits: 10 uploads per 15 minutes per IP
 */
export const imageUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per window
  message: 'Too many image uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many image uploads. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter for merchant replies
 * Limits: 20 replies per hour per merchant
 */
export const merchantReplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many replies. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many replies. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
