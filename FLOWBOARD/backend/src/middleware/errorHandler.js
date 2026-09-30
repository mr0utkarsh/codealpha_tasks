import { ApiError } from '../lib/ApiError.js';
import { env } from '../config/env.js';

/** 404 for unmatched API routes. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} was not found.`));
}

/**
 * Central error handler. Translates known error kinds (ApiError, Prisma,
 * body-parser) into clean JSON; everything else becomes a 500 without leaking
 * internals to the client.
 */
export function errorHandler(err, _req, res, _next) {
  let status = err instanceof ApiError ? err.status : err.status || err.statusCode || 500;
  let message = err instanceof ApiError ? err.message : err.message || 'Something went wrong.';
  let details = err instanceof ApiError ? err.details : undefined;

  // Prisma known-error codes.
  if (err?.code === 'P2002') {
    status = 409;
    message = 'A record with that value already exists.';
    details = { fields: err.meta?.target };
  } else if (err?.code === 'P2025') {
    status = 404;
    message = 'The requested record was not found.';
  } else if (err?.code === 'P2003') {
    status = 400;
    message = 'Related record does not exist.';
  }

  // Malformed JSON body.
  if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body.';
  }

  if (status >= 500) {
    console.error('[api] Unhandled error:', err);
    if (env.isProduction) message = 'Internal server error.';
  }

  res.status(status).json({
    success: false,
    error: { message, ...(details ? { details } : {}) },
  });
}

export default errorHandler;
