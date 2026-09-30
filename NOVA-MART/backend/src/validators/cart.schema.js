import { z } from 'zod';
import { idSchema } from './common.js';

export const MAX_QUANTITY_PER_ITEM = 20;

export const addToCartSchema = z.object({
  productId: idSchema,
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Add at least one item.')
    .max(MAX_QUANTITY_PER_ITEM, `You can add up to ${MAX_QUANTITY_PER_ITEM} of the same item.`)
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(0, 'Quantity cannot be negative.')
    .max(MAX_QUANTITY_PER_ITEM, `You can keep up to ${MAX_QUANTITY_PER_ITEM} of the same item.`),
});

export const cartItemIdParamSchema = z.object({
  itemId: idSchema,
});

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: idSchema,
        quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_ITEM).default(1),
      })
    )
    .max(50, 'Too many items in one request.')
    .default([]),
});

export const wishlistAddSchema = z.union([
  z.object({ productId: idSchema }),
  z.object({ productIds: z.array(idSchema).min(1, 'Provide at least one product.').max(50) }),
]);

export const wishlistToggleSchema = z.object({ productId: idSchema });

export const wishlistParamSchema = z.object({ productId: idSchema });


