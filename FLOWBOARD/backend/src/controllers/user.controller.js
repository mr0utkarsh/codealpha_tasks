import { PUBLIC_USER_SELECT } from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { ok } from '../lib/respond.js';

/**
 * GET /api/users?q=
 * Lightweight people search used when adding project members and assigning
 * tasks. Never returns password hashes; excludes the current user.
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();

  const where = {
    id: { not: req.user.id },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: PUBLIC_USER_SELECT,
    orderBy: { name: 'asc' },
    take: 12,
  });

  ok(res, users);
});
