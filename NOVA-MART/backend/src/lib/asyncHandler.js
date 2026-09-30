/**
 * Wraps an async route handler so rejected promises reach Express' error
 * handling middleware instead of becoming unhandled rejections.
 *
 * @template {import('express').RequestHandler} Handler
 * @param {Handler} handler
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export default asyncHandler;
