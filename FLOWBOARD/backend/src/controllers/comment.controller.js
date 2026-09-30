import { ApiError } from '../lib/ApiError.js';
import { PUBLIC_USER_SELECT, logActivity, requireTaskAccess } from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { created, ok } from '../lib/respond.js';

/** GET /api/tasks/:id/comments */
export const listComments = asyncHandler(async (req, res) => {
  const { task } = await requireTaskAccess(req.params.id, req.user);

  const comments = await prisma.comment.findMany({
    where: { taskId: task.id },
    include: { author: { select: PUBLIC_USER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  ok(res, comments);
});

/** POST /api/tasks/:id/comments */
export const addComment = asyncHandler(async (req, res) => {
  const { task, project } = await requireTaskAccess(req.params.id, req.user);
  const { content } = req.body;

  const comment = await prisma.comment.create({
    data: { content, taskId: task.id, authorId: req.user.id },
    include: { author: { select: PUBLIC_USER_SELECT } },
  });

  await logActivity({
    type: 'COMMENT_ADDED',
    description: `${req.user.name} commented on "${task.title}"`,
    projectId: project.id,
    taskId: task.id,
    userId: req.user.id,
  });

  created(res, comment);
});

/** DELETE /api/comments/:id - authors may delete their own comments. */
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await prisma.comment.findUnique({
    where: { id: req.params.id },
    include: { task: { select: { id: true, title: true, projectId: true } } },
  });

  if (!comment) throw ApiError.notFound('Comment not found.');

  if (comment.authorId !== req.user.id) {
    throw ApiError.forbidden('You can only delete your own comments.');
  }

  await prisma.comment.delete({ where: { id: comment.id } });

  ok(res, { id: comment.id });
});
