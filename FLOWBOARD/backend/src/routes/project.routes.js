import { Router } from 'express';
import { addMember, listMembers, removeMember } from '../controllers/member.controller.js';
import {
  createProject,
  deleteProject,
  getProject,
  listActivities,
  listProjects,
  updateProject,
} from '../controllers/project.controller.js';
import { createTask, listTasks } from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.js';
import { addMemberSchema } from '../validators/comment.schema.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.schema.js';
import { createTaskSchema, listTasksQuerySchema } from '../validators/task.schema.js';

const router = Router();

// Projects
router.get('/', validate(listProjectsQuerySchema, 'query'), listProjects);
router.post('/', validate(createProjectSchema), createProject);
router.get('/:id', getProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

// Members
router.get('/:id/members', listMembers);
router.post('/:id/members', validate(addMemberSchema), addMember);
router.delete('/:id/members/:userId', removeMember);

// Tasks (nested under a project for board data)
router.get('/:id/tasks', validate(listTasksQuerySchema, 'query'), listTasks);
router.post('/:id/tasks', validate(createTaskSchema), createTask);

// Activity feed
router.get('/:id/activities', listActivities);

export default router;
