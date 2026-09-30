import { ApiError } from '../lib/ApiError.js';
import { PUBLIC_USER_SELECT, logActivity, requireProjectAccess } from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { created, ok } from '../lib/respond.js';

/** Relations every project response needs to render cards and detail pages. */
const projectInclude = {
  owner: { select: PUBLIC_USER_SELECT },
  members: {
    include: { user: { select: PUBLIC_USER_SELECT } },
    orderBy: { joinedAt: 'asc' },
  },
  tasks: { select: { status: true } },
  _count: { select: { tasks: true } },
};

/** Adds computed task statistics used by cards, progress bars and filters. */
function serializeProject(project) {
  const tasks = project.tasks || [];
  const byStatus = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  for (const task of tasks) byStatus[task.status] += 1;

  const total = tasks.length;
  const done = byStatus.DONE;

  const { tasks: _tasks, ...rest } = project;
  return {
    ...rest,
    taskCount: total,
    stats: {
      total,
      byStatus,
      done,
      pending: total - done,
      progress: total ? Math.round((done / total) * 100) : 0,
    },
  };
}

/** GET /api/projects - projects the current user belongs to. */
export const listProjects = asyncHandler(async (req, res) => {
  const { q, status, sort } = req.validatedQuery ?? req.query;

  const where = {
    members: { some: { userId: req.user.id } },
    ...(status !== 'ALL' ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: { updatedAt: 'desc' },
  });

  const data = projects.map(serializeProject);

  if (sort === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'due') {
    data.sort((a, b) => {
      const av = a.dueDate ? Date.parse(a.dueDate) : Number.MAX_SAFE_INTEGER;
      const bv = b.dueDate ? Date.parse(b.dueDate) : Number.MAX_SAFE_INTEGER;
      return av - bv;
    });
  } else {
    data.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  ok(res, data);
});

/** POST /api/projects - creator becomes owner and first OWNER member. */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, startDate, dueDate, memberIds } = req.body;

  const invitedIds = [...new Set((memberIds || []).filter((id) => id !== req.user.id))];

  const invitedUsers = invitedIds.length
    ? await prisma.user.findMany({
        where: { id: { in: invitedIds } },
        select: { id: true, name: true },
      })
    : [];

  if (invitedUsers.length !== invitedIds.length) {
    throw ApiError.badRequest('One or more selected members do not exist.');
  }

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        name,
        description,
        status,
        startDate,
        dueDate,
        ownerId: req.user.id,
        members: {
          create: [
            { userId: req.user.id, role: 'OWNER' },
            ...invitedIds.map((userId) => ({ userId, role: 'MEMBER' })),
          ],
        },
      },
      include: projectInclude,
    });

    await tx.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        description: `${req.user.name} created the project`,
        projectId: createdProject.id,
        userId: req.user.id,
      },
    });

    for (const user of invitedUsers) {
      await tx.activity.create({
        data: {
          type: 'MEMBER_ADDED',
          description: `${req.user.name} added ${user.name} to the project`,
          projectId: createdProject.id,
          userId: req.user.id,
        },
      });
    }

    return createdProject;
  });

  created(res, serializeProject(project));
});

/** GET /api/projects/:id - members must be part of the project. */
export const getProject = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user);

  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectInclude,
  });

  ok(res, serializeProject(full));
});

/** PUT /api/projects/:id - owner or admin only. */
export const updateProject = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user, 'ownerOrAdmin');

  const { name, description, status, startDate, dueDate } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.status = status;
  if (startDate !== undefined) data.startDate = startDate;
  if (dueDate !== undefined) data.dueDate = dueDate;

  const updated = await prisma.project.update({
    where: { id: project.id },
    data,
    include: projectInclude,
  });

  await logActivity({
    type: 'PROJECT_UPDATED',
    description: `${req.user.name} updated the project details`,
    projectId: project.id,
    userId: req.user.id,
  });

  ok(res, serializeProject(updated));
});

/** DELETE /api/projects/:id - owner only. Cascades to tasks/comments/etc. */
export const deleteProject = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user, 'owner');

  await prisma.project.delete({ where: { id: project.id } });

  ok(res, { id: project.id });
});

/** GET /api/projects/:id/activities - newest first. */
export const listActivities = asyncHandler(async (req, res) => {
  const { project } = await requireProjectAccess(req.params.id, req.user);

  const activities = await prisma.activity.findMany({
    where: { projectId: project.id },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  ok(res, activities);
});


