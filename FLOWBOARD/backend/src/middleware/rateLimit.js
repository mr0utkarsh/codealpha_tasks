import rateLimit from 'express-rate-limit';

/** General API limiter - generous enough for a normal interactive session. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests. Please slow down and try again shortly.' },
  },
});

/** Stricter limiter for credential endpoints to slow down brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many authentication attempts. Please try again later.' },
  },
});

export default apiLimiter;
