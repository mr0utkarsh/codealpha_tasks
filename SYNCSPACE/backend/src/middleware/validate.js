import { ApiError } from '../lib/ApiError.js';

/**
 * Validates `req[source]` against a Zod schema, replacing the value with the
 * parsed (and coerced) result on success.
 *
 * Note: in Express 5 `req.query` is a getter-only property, so parsed query
 * values are exposed on `req.validatedQuery` instead of being written back.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed.', details));
    }

    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}

export default validate;
