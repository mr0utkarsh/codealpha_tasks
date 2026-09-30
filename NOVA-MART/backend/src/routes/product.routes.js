import { Router } from 'express';
import * as controller from '../controllers/product.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from '../validators/product.schema.js';

const router = Router();

/** Public catalogue */
router.get('/', validate({ query: listProductsQuerySchema }), controller.list);
router.get('/categories', controller.categories);
router.get('/summary', controller.summary);
router.get('/:id', validate({ params: productIdParamSchema }), controller.detail);

/** Admin catalogue management */
router.post('/', authenticate, requireAdmin, validate({ body: createProductSchema }), controller.create);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  controller.update
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productIdParamSchema }),
  controller.remove
);

export default router;
