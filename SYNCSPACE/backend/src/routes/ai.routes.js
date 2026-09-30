import { Router } from 'express';
import { summarizeChat, rewriteMessage, suggestReplies } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/chat/:roomCode/summarize', summarizeChat);
router.post('/chat/rewrite', rewriteMessage);
router.post('/chat/:roomCode/suggest-replies', suggestReplies);

export default router;