import { Router } from 'express';
import authRoutes from './auth.routes.js';
import aiRoutes from './ai.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * Liveness + database probe. Handy for uptime monitors and for confirming that
 * a deployment can reach PostgreSQL.
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    let database = 'up';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    const healthy = database === 'up';

    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      data: {
        status: healthy ? 'ok' : 'degraded',
        database,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  })
);

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);

export default router;
