import { Router } from 'express';
import * as controller from '../controllers/order.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '../validators/order.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createOrderSchema }), controller.create);
router.get('/', validate({ query: listOrdersQuerySchema }), controller.list);
router.get('/stats', controller.stats);
router.get('/:id', validate({ params: orderIdParamSchema }), controller.detail);
router.post('/:id/cancel', validate({ params: orderIdParamSchema }), controller.cancel);
router.patch(
  '/:id/status',
  requireAdmin,
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  controller.updateStatus
);

export default router;
