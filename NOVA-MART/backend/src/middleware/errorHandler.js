import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/ApiError.js';
import { env } from '../config/env.js';

/**
 * 404 handler for unknown routes.
 */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No API route matches ${req.method} ${req.originalUrl}.`));
}

/**
 * Central error handler. Translates known error types into consistent JSON.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong on our side.';
  let code = 'INTERNAL_ERROR';
  let details;

  if (error instanceof ApiError) {
    ({ statusCode, message, code, details } = error);
  } else if (error?.name === 'ZodError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Please check the highlighted fields.';
    details = error.issues?.map((issue) => ({
      field: issue.path.join('.') || 'request',
      message: issue.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'value';
        statusCode = 409;
        code = 'DUPLICATE';
        message = `That ${target} is already in use.`;
        break;
      }
      case 'P2025':
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'We could not find what you were looking for.';
        break;
      case 'P2003':
        statusCode = 409;
        code = 'CONFLICT';
        message = 'This record is still referenced by other data and cannot be changed.';
        break;
      case 'P2014':
        statusCode = 409;
        code = 'CONFLICT';
        message = 'That change would break an existing relationship between records.';
        break;
      default:
        statusCode = 400;
        code = error.code;
        message = 'The database rejected that request.';
        break;
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'The request contained invalid data.';
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'The request body is not valid JSON.';
  } else if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Your session is no longer valid. Please sign in again.';
  }

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  }

  const payload = {
    success: false,
    message,
    code,
  };

  if (details) payload.details = details;
  if (env.isDevelopment && statusCode >= 500) payload.stack = error.stack;

  res.status(statusCode).json(payload);
}

export default errorHandler;
