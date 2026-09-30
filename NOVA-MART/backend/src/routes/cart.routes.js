import { Router } from 'express';
import * as controller from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addToCartSchema,
  cartItemIdParamSchema,
  mergeCartSchema,
  updateCartItemSchema,
} from '../validators/cart.schema.js';

const router = Router();

// Every cart route belongs to the signed-in customer.
router.use(authenticate);

router.get('/', controller.get);
router.post('/', validate({ body: addToCartSchema }), controller.add);
router.post('/merge', validate({ body: mergeCartSchema }), controller.merge);
router.patch(
  '/:itemId',
  validate({ params: cartItemIdParamSchema, body: updateCartItemSchema }),
  controller.updateQuantity
);
router.delete('/:itemId', validate({ params: cartItemIdParamSchema }), controller.removeItem);
router.delete('/', controller.clear);

export default router;
