/**
 * Error type used by the API. Anything thrown as an `ApiError` is translated
 * into a predictable JSON response by the error handler middleware.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message    human readable message shown to the client
   * @param {unknown} [details] optional field level details
   * @param {string} [code]     optional machine readable error code
   */
  constructor(statusCode, message, details, code) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'The request could not be understood.', details) {
    return new ApiError(400, message, details, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Please sign in to continue.') {
    return new ApiError(401, message, undefined, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(403, message, undefined, 'FORBIDDEN');
  }

  static notFound(message = 'We could not find what you were looking for.') {
    return new ApiError(404, message, undefined, 'NOT_FOUND');
  }

  static conflict(message = 'That action conflicts with the current state.', details) {
    return new ApiError(409, message, details, 'CONFLICT');
  }

  static unprocessable(message = 'Some fields need your attention.', details) {
    return new ApiError(422, message, details, 'VALIDATION_ERROR');
  }

  static tooManyRequests(message = 'Too many attempts. Please try again shortly.') {
    return new ApiError(429, message, undefined, 'RATE_LIMITED');
  }

  static internal(message = 'Something went wrong on our side.') {
    return new ApiError(500, message, undefined, 'INTERNAL_ERROR');
  }
}

export default ApiError;
