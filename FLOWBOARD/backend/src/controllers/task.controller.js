import { ApiError } from '../lib/ApiError.js';
import {
  PUBLIC_USER_SELECT,
  STATUS_LABELS,
  logActivity,
  requireProjectAccess,
  requireTaskAccess,
} from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { created, ok } from '../lib/respond.js';

const taskListInclude = {
  assignee: { select: PUBLIC_USER_SELECT },
  _count: { select: { comments: true } },
};

/** Verifies the assignee actually belongs to the project. */
async function assertProjectMember(projectId, userId) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) {
    throw ApiError.badRequest('Assignee must be a member of this project.');
  }
}

/** GET /api/projects/:id/tasks - board data with filters and search. */
export const listTasks = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user);
  const { q, status, priority, assignee } = req.validatedQuery ?? req.query;

  const where = {
    projectId: project.id,
    ...(status !== 'ALL' ? { status } : {}),
    ...(priority !== 'ALL' ? { priority } : {}),
    ...(assignee === 'none'
      ? { assigneeId: null }
      : assignee && assignee !== 'ALL'
        ? { assigneeId: assignee }
        : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: taskListInclude,
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  ok(res, tasks);
});

/** POST /api/projects/:id/tasks */
export const createTask = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user);
  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  if (assigneeId) await assertProjectMember(project.id, assigneeId);

  // Place the new task at the bottom of its column.
  const last = await prisma.task.findFirst({
    where: { projectId: project.id, status },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId: assigneeId || null,
      position: (last?.position ?? -1) + 1,
      projectId: project.id,
    },
    include: taskListInclude,
  });

  await logActivity({
    type: 'TASK_CREATED',
    description: `${req.user.name} created "${task.title}"`,
    projectId: project.id,
    taskId: task.id,
    userId: req.user.id,
  });

  created(res, task);
});

/** GET /api/tasks/:id - full detail with comments and activity. */
export const getTask = asyncHandler(async (req, res) => {
  const { task } = await requireTaskAccess(req.params.id, req.user);

  const full = await prisma.task.findUnique({
    where: { id: task.id },
    include: {
      assignee: { select: PUBLIC_USER_SELECT },
      project: { select: { id: true, name: true, status: true, ownerId: true } },
      comments: {
        include: { author: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'asc' },
      },
      activities: {
        include: { user: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      _count: { select: { comments: true } },
    },
  });

  ok(res, full);
});

/** PUT /api/tasks/:id - any project member may update a task. */
export const updateTask = asyncHandler(async (req, res) => {
  const { task, project } = await requireTaskAccess(req.params.id, req.user);
  const { title, description, status, priority, dueDate, assigneeId, position } = req.body;

  if (assigneeId) await assertProjectMember(project.id, assigneeId);

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
  if (position !== undefined) data.position = position;

  const statusChanged = status !== undefined && status !== task.status;
  if (status !== undefined) data.status = status;

  const updated = await prisma.task.update({
    where: { id: task.id },
    data,
    include: taskListInclude,
  });

  if (statusChanged) {
    await logActivity({
      type: 'TASK_MOVED',
      description: `${req.user.name} moved "${task.title}" from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[status]}`,
      projectId: project.id,
      taskId: task.id,
      userId: req.user.id,
    });
  } else if (title !== undefined || description !== undefined || priority !== undefined || dueDate !== undefined || assigneeId !== undefined) {
    await logActivity({
      type: 'TASK_UPDATED',
      description: `${req.user.name} updated "${updated.title}"`,
      projectId: project.id,
      taskId: task.id,
      userId: req.user.id,
    });
  }

  ok(res, updated);
});

/** DELETE /api/tasks/:id - owner, admin or the assignee. */
export const deleteTask = asyncHandler(async (req, res) => {
  const { task, isOwner, membership } = await requireTaskAccess(req.params.id, req.user);

  const isAdmin = isOwner || membership?.role === 'ADMIN';
  const isAssignee = task.assigneeId === req.user.id;

  if (!isAdmin && !isAssignee) {
    throw ApiError.forbidden('Only the project owner, an admin or the assignee can delete this task.');
  }

  await prisma.task.delete({ where: { id: task.id } });

  // taskId is null so the entry survives the cascade delete of the task.
  await logActivity({
    type: 'TASK_DELETED',
    description: `${req.user.name} deleted "${task.title}"`,
    projectId: task.projectId,
    taskId: null,
    userId: req.user.id,
  });

  ok(res, { id: task.id });
});

