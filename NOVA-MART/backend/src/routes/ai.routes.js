import { Router } from 'express';
import { generateProductDescription } from '../controllers/ai.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { assistSearch, recommendProducts } from '../controllers/ai.controller.js';

const router = Router();

// Admin only
router.post('/product-description', authenticate, requireAdmin, generateProductDescription);

// Authenticated users
router.post('/search-assist', authenticate, assistSearch);
router.post('/recommendations', authenticate, recommendProducts);

export default router;