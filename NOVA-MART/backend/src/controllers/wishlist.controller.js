import { asyncHandler } from '../lib/asyncHandler.js';
import { created, message, ok } from '../lib/respond.js';
import * as wishlistService from '../services/wishlist.service.js';

/** GET /api/wishlist */
export const list = asyncHandler(async (req, res) => ok(res, await wishlistService.getWishlist(req.user.id)));

/** POST /api/wishlist - accepts `{ productId }` or `{ productIds: [] }` */
export const add = asyncHandler(async (req, res) => {
  const { productId, productIds } = req.validated.body;

  if (productIds) {
    const result = await wishlistService.addManyToWishlist(req.user.id, productIds);
    return created(res, result, `${result.added} item(s) saved to your wishlist.`);
  }

  const result = await wishlistService.addToWishlist(req.user.id, productId);
  return created(res, result, result.added ? 'Saved to your wishlist.' : 'Already in your wishlist.');
});


/** DELETE /api/wishlist/:productId */
export const remove = asyncHandler(async (req, res) => {
  const result = await wishlistService.removeFromWishlist(req.user.id, req.validated.params.productId);
  return message(res, result, 'Removed from your wishlist.');
});

/** POST /api/wishlist/toggle */
export const toggle = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleWishlist(req.user.id, req.validated.body.productId);
  return message(
    res,
    result,
    result.saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.'
  );
});
