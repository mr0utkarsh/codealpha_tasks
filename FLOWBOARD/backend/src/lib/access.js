import prisma from './prisma.js';
import { ApiError } from './ApiError.js';

/** Public-safe user projection - never includes the password hash. */
export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  createdAt: true,
};

/**
 * Loads a project and verifies the current user is a member.
 * Throws 404 for missing projects and 403 for non-members.
 *
 * @param {string} projectId
 * @param {{ id: string }} user
 * @param {'owner'|'ownerOrAdmin'|null} requiredRole
 */
export async function requireProjectAccess(projectId, user, requiredRole = null) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId: user.id } } },
  });

  if (!project) throw ApiError.notFound('Project not found.');

  const membership = project.members[0] ?? null;
  const isOwner = project.ownerId === user.id;

  if (!membership && !isOwner) {
    throw ApiError.forbidden('You are not a member of this project.');
  }

  if (requiredRole === 'owner' && !isOwner) {
    throw ApiError.forbidden('Only the project owner can perform this action.');
  }

  if (requiredRole === 'ownerOrAdmin' && !isOwner && membership?.role === 'MEMBER') {
    throw ApiError.forbidden('Only the project owner or an admin can perform this action.');
  }

  return { project, membership, isOwner };
}

/**
 * Loads a task (with its project) and verifies the current user is a member
 * of the task's project.
 */
export async function requireTaskAccess(taskId, user) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: { where: { userId: user.id } } } },
    },
  });

  if (!task) throw ApiError.notFound('Task not found.');

  const membership = task.project.members[0] ?? null;
  const isOwner = task.project.ownerId === user.id;

  if (!membership && !isOwner) {
    throw ApiError.forbidden('You are not a member of this project.');
  }

  return { task, project: task.project, membership, isOwner };
}

/** Persists one activity feed entry. */
export async function logActivity({
  type,
  description,
  projectId,
  taskId = null,
  userId = null,
}) {
  return prisma.activity.create({
    data: { type, description, projectId, taskId, userId },
  });
}

/** Human labels for enums (used in activity descriptions). */
export const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};
