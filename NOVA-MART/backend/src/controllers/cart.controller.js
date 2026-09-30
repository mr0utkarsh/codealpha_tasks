import { asyncHandler } from '../lib/asyncHandler.js';
import { message, ok } from '../lib/respond.js';
import * as cartService from '../services/cart.service.js';

/** GET /api/cart */
export const get = asyncHandler(async (req, res) => ok(res, await cartService.getCart(req.user.id)));

/** POST /api/cart */
export const add = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user.id, req.validated.body);
  return message(res, cart, 'Added to your bag.');
});

/** PATCH /api/cart/:itemId */
export const updateQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItemQuantity(
    req.user.id,
    req.validated.params.itemId,
    req.validated.body.quantity
  );
  return message(res, cart, 'Bag updated.');
});

/** DELETE /api/cart/:itemId */
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user.id, req.validated.params.itemId);
  return message(res, cart, 'Item removed from your bag.');
});

/** DELETE /api/cart */
export const clear = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  return message(res, cart, 'Your bag is now empty.');
});

/** POST /api/cart/merge - folds a guest cart into the signed-in cart */
export const merge = asyncHandler(async (req, res) => {
  const cart = await cartService.mergeCart(req.user.id, req.validated.body.items);
  return message(res, cart, 'Your bag has been synced.');
});
