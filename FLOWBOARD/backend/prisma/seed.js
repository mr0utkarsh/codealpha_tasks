/**
 * FLOWBOARD seed data.
 *
 * Creates a realistic workspace: 7 people, 3 projects, 22 tasks spread across
 * all four board columns, threaded comments and an activity feed - so the
 * dashboard is populated the moment the API boots.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { TASKS } from './seed-tasks.part.js';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';

const day = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * day);
const daysFromNow = (n) => new Date(Date.now() + n * day);

const USERS = [
  { key: 'aarav', name: 'Aarav Sharma', email: 'aarav@flowboard.app' },
  { key: 'priya', name: 'Priya Nair', email: 'priya@flowboard.app' },
  { key: 'rohan', name: 'Rohan Mehta', email: 'rohan@flowboard.app' },
  { key: 'sana', name: 'Sana Iqbal', email: 'sana@flowboard.app' },
  { key: 'daniel', name: 'Daniel Okafor', email: 'daniel@flowboard.app' },
  { key: 'emily', name: 'Emily Zhang', email: 'emily@flowboard.app' },
  { key: 'marcus', name: 'Marcus Reid', email: 'marcus@flowboard.app' },
];

const PROJECTS = [
  {
    key: 'web',
    name: 'Flowboard Web Revamp',
    description:
      'Rebuild the marketing site and the authenticated workspace on the new design system. Ship the new navigation, the refreshed pricing page and a faster first paint across the board.',
    status: 'ACTIVE',
    startDate: daysAgo(34),
    dueDate: daysFromNow(26),
    owner: 'aarav',
    createdAt: daysAgo(34),
    members: [
      { user: 'aarav', role: 'OWNER' },
      { user: 'priya', role: 'ADMIN' },
      { user: 'rohan', role: 'MEMBER' },
      { user: 'sana', role: 'MEMBER' },
      { user: 'emily', role: 'MEMBER' },
    ],
  },
  {
    key: 'mobile',
    name: 'Mobile App Beta',
    description:
      'Prepare the iOS and Android beta build: offline caching, push notifications, crash reporting and the beta onboarding checklist for the first 200 testers.',
    status: 'PLANNING',
    startDate: daysAgo(12),
    dueDate: daysFromNow(48),
    owner: 'priya',
    createdAt: daysAgo(12),
    members: [
      { user: 'priya', role: 'OWNER' },
      { user: 'aarav', role: 'MEMBER' },
      { user: 'daniel', role: 'MEMBER' },
      { user: 'marcus', role: 'MEMBER' },
    ],
  },
  {
    key: 'support',
    name: 'Customer Support Revamp',
    description:
      'Roll out the new help centre, macro library and SLA reporting. Train the support team and migrate the 200 most frequent tickets into macros.',
    status: 'COMPLETED',
    startDate: daysAgo(96),
    dueDate: daysAgo(9),
    owner: 'daniel',
    createdAt: daysAgo(96),
    members: [
      { user: 'daniel', role: 'OWNER' },
      { user: 'sana', role: 'ADMIN' },
      { user: 'aarav', role: 'MEMBER' },
      { user: 'marcus', role: 'MEMBER' },
      { user: 'emily', role: 'MEMBER' },
    ],
  },
];

async function main() {
  console.log('[seed] Clearing existing data...');
  // Child rows first so foreign keys stay happy regardless of cascade rules.
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('[seed] Creating users...');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userByKey = {};

  for (const user of USERS) {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        createdAt: daysAgo(120),
      },
    });
    userByKey[user.key] = created;
  }

  console.log('[seed] Creating projects, members and tasks...');
  const projectByKey = {};
  let taskCount = 0;
  let commentCount = 0;

  for (const project of PROJECTS) {
    const owner = userByKey[project.owner];

    const created = await prisma.project.create({
      data: {
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        dueDate: project.dueDate,
        ownerId: owner.id,
        createdAt: project.createdAt,
        members: {
          create: project.members.map((member) => ({
            userId: userByKey[member.user].id,
            role: member.role,
            joinedAt: project.createdAt,
          })),
        },
      },
    });
    projectByKey[project.key] = created;

    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        description: `${owner.name} created the project`,
        projectId: created.id,
        userId: owner.id,
        createdAt: project.createdAt,
      },
    });

    for (const member of project.members) {
      if (member.user === project.owner) continue;
      await prisma.activity.create({
        data: {
          type: 'MEMBER_ADDED',
          description: `${owner.name} added ${userByKey[member.user].name} to the project`,
          projectId: created.id,
          userId: owner.id,
          createdAt: new Date(project.createdAt.getTime() + 60 * 60 * 1000),
        },
      });
    }
  }

  // Tasks + their comments + matching activity entries.
  for (const task of TASKS) {
    const project = projectByKey[task.project];
    const author = task.assignee
      ? userByKey[task.assignee]
      : userByKey[PROJECTS.find((p) => p.key === task.project).owner];
    const createdAt = daysAgo(task.created);

    const siblings = await prisma.task.count({
      where: { projectId: project.id, status: task.status },
    });

    const created = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due,
        position: siblings,
        projectId: project.id,
        assigneeId: task.assignee ? userByKey[task.assignee].id : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    taskCount += 1;

    await prisma.activity.create({
      data: {
        type: 'TASK_CREATED',
        description: `${author.name} created "${created.title}"`,
        projectId: project.id,
        taskId: created.id,
        userId: author.id,
        createdAt,
      },
    });

    // A believable history: work that is done or in flight was moved along.
    if (task.status !== 'TODO') {
      const from = task.status === 'DONE' ? 'IN_REVIEW' : 'TODO';
      await prisma.activity.create({
        data: {
          type: 'TASK_MOVED',
          description: `${author.name} moved "${created.title}" from ${from === 'TODO' ? 'To Do' : 'In Review'} to ${
            { IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' }[task.status]
          }`,
          projectId: project.id,
          taskId: created.id,
          userId: author.id,
          createdAt: new Date(createdAt.getTime() + 2 * day),
        },
      });
    }

    for (const comment of task.comments) {
      const commentAt = daysAgo(Math.max(task.created - 1, comment.age));
      await prisma.comment.create({
        data: {
          content: comment.content,
          taskId: created.id,
          authorId: userByKey[comment.author].id,
          createdAt: commentAt,
          updatedAt: commentAt,
        },
      });
      commentCount += 1;

      await prisma.activity.create({
        data: {
          type: 'COMMENT_ADDED',
          description: `${userByKey[comment.author].name} commented on "${created.title}"`,
          projectId: project.id,
          taskId: created.id,
          userId: userByKey[comment.author].id,
          createdAt: commentAt,
        },
      });
    }
  }

  console.log(
    `[seed] Done: ${USERS.length} users, ${PROJECTS.length} projects, ${taskCount} tasks, ${commentCount} comments.`
  );
  console.log('[seed] Sign in with any of these accounts (password: ' + PASSWORD + '):');
  for (const user of USERS) console.log(`         ${user.email}`);
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

