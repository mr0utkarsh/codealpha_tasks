import { Router } from 'express';
import {
  generateTaskDescription,
  generateProjectDescription,
  assistComment,
  suggestTasks,
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/project-description', generateProjectDescription);
router.post('/projects/:projectId/task-description', generateTaskDescription);
router.post('/tasks/:taskId/comment-assist', assistComment);
router.post('/projects/:projectId/task-suggestions', suggestTasks);

export default router;