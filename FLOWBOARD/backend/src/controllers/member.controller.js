import { ApiError } from '../lib/ApiError.js';
import { PUBLIC_USER_SELECT, logActivity, requireProjectAccess } from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { created, ok } from '../lib/respond.js';

/** GET /api/projects/:id/members */
export const listMembers = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user);

  const members = await prisma.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: { select: PUBLIC_USER_SELECT } },
    orderBy: { joinedAt: 'asc' },
  });

  ok(res, members);
});

/** POST /api/projects/:id/members - owner or admin only. */
export const addMember = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user, 'ownerOrAdmin');
  const { userId, role } = req.body;

  if (userId === project.ownerId) {
    throw ApiError.badRequest('The project owner is already a member.');
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });
  if (!target) throw ApiError.notFound('That user does not exist.');

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
  });
  if (existing) throw ApiError.conflict('That user is already a member of this project.');

  const member = await prisma.projectMember.create({
    data: { projectId: project.id, userId, role },
    include: { user: { select: PUBLIC_USER_SELECT } },
  });

  await logActivity({
    type: 'MEMBER_ADDED',
    description: `${req.user.name} added ${target.name} to the project`,
    projectId: project.id,
    userId: req.user.id,
  });

  created(res, member);
});

/** DELETE /api/projects/:id/members/:userId - owner or admin only. */
export const removeMember = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user, 'ownerOrAdmin');
  const { userId } = req.params;

  if (userId === project.ownerId) {
    throw ApiError.badRequest('The project owner cannot be removed.');
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
    include: { user: { select: PUBLIC_USER_SELECT } },
  });
  if (!member) throw ApiError.notFound('That user is not a member of this project.');

  // Membership and their task assignments are cleaned up together.
  await prisma.$transaction([
    prisma.projectMember.delete({
      where: { projectId_userId: { projectId: project.id, userId } },
    }),
    prisma.task.updateMany({
      where: { projectId: project.id, assigneeId: userId },
      data: { assigneeId: null },
    }),
  ]);

  await logActivity({
    type: 'MEMBER_REMOVED',
    description: `${req.user.name} removed ${member.user.name} from the project`,
    projectId: project.id,
    userId: req.user.id,
  });

  ok(res, { projectId: project.id, userId });
});
