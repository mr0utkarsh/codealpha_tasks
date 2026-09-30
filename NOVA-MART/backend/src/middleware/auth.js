import { ApiError } from '../lib/ApiError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
};

function readBearerToken(req) {
  const header = req.headers.authorization ?? req.headers.Authorization ?? '';
  if (typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function resolveUser(req) {
  const token = readBearerToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    }
    throw ApiError.unauthorized('That authentication token is not valid.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: USER_FIELDS });
  if (!user) {
    throw ApiError.unauthorized('This account no longer exists.');
  }

  return user;
}

/**
 * Requires a valid `Authorization: Bearer <jwt>` header.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) {
    throw ApiError.unauthorized('Please sign in to continue.');
  }
  req.user = user;
  next();
});

/**
 * Attaches `req.user` when a valid token is present, otherwise continues as a
 * guest. Invalid tokens are treated as "no token" so public pages never break.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  try {
    req.user = await resolveUser(req);
  } catch {
    req.user = null;
  }
  next();
});

/**
 * Must be used after {@link authenticate} - restricts a route to admins.
 */
export function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Administrator access is required for this action.'));
  }
  return next();
}
