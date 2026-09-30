import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../lib/ApiError.js';

/**
 * @param {{ windowMs: number, limit: number, message: string }} options
 */
function buildLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });
}

/** Broad protection for the whole API surface. */
export const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 800,
  message: 'Too many requests from this device. Please slow down and try again shortly.',
});

/** Stricter protection for credential endpoints (brute force mitigation). */
export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});
