import { PUBLIC_USER_SELECT } from '../lib/access.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import prisma from '../lib/prisma.js';
import { ok } from '../lib/respond.js';

/**
 * GET /api/dashboard
 * Real aggregates computed from PostgreSQL for every project the current
 * user belongs to - nothing here is hardcoded on the client.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, status: true, tasks: { select: { status: true, assigneeId: true } } },
  });

  let totalTasks = 0;
  let pendingTasks = 0;
  let doneTasks = 0;
  let assignedToMe = 0;
  let myPending = 0;

  for (const project of projects) {
    for (const task of project.tasks) {
      totalTasks += 1;
      if (task.status === 'DONE') {
        doneTasks += 1;
      } else {
        pendingTasks += 1;
      }
      if (task.assigneeId === userId) {
        assignedToMe += 1;
        if (task.status !== 'DONE') myPending += 1;
      }
    }
  }

  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

  const recentActivity = await prisma.activity.findMany({
    where: { project: { members: { some: { userId } } } },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  ok(res, {
    stats: {
      totalProjects: projects.length,
      activeProjects: projects.length - completedProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      doneTasks,
      assignedToMe,
      myPending,
      progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
    recentActivity,
  });
});
