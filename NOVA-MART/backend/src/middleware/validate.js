import { ApiError } from '../lib/ApiError.js';

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'request',
    message: issue.message,
  }));
}

function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw ApiError.unprocessable('Please check the highlighted fields.', formatIssues(result.error));
  }
  return result.data;
}

/**
 * Validates and normalises request input with Zod schemas.
 *
 * Parsed values are exposed as `req.validated.{body,query,params}` - controllers
 * should read from there so they always receive coerced, safe values.
 *
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas = {}) {
  return function validateRequest(req, _res, next) {
    try {
      const validated = {};

      if (schemas.body) validated.body = parseOrThrow(schemas.body, req.body ?? {});
      if (schemas.query) validated.query = parseOrThrow(schemas.query, req.query ?? {});
      if (schemas.params) validated.params = parseOrThrow(schemas.params, req.params ?? {});

      req.validated = { ...(req.validated ?? {}), ...validated };
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Accepts `true`/`false`/`1`/`0` query string values as booleans.
 *
 * @param {import('zod').ZodTypeAny} [fallback]
 */
export function booleanQuery(schema) {
  return schema.optional().transform((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes'].includes(String(value).toLowerCase());
  });
}
