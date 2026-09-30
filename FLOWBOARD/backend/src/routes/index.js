import { Router } from 'express';
import authRoutes from './auth.routes.js';
import aiRoutes from './ai.routes.js';
import commentRoutes from './comment.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Liveness probe. */
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'flowboard-api' } });
});

// Public auth endpoints (register/login); /me is protected inside its router.
router.use('/auth', authRoutes);

// Everything below requires a valid JWT.
router.use(requireAuth);
router.use('/ai', aiRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
