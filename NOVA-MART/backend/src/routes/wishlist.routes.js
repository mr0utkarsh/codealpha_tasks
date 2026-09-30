import { Router } from 'express';
import * as controller from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  wishlistAddSchema,
  wishlistParamSchema,
  wishlistToggleSchema,
} from '../validators/cart.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validate({ body: wishlistAddSchema }), controller.add);
router.post('/toggle', validate({ body: wishlistToggleSchema }), controller.toggle);
router.delete('/:productId', validate({ params: wishlistParamSchema }), controller.remove);

export default router;

