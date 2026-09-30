import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../config/constants.js';
import { emailSchema, idSchema, paginationSchema } from './common.js';
import { MAX_QUANTITY_PER_ITEM } from './cart.schema.js';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name.').max(80),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a contact number.')
    .max(30)
    .refine(
      (value) => /^[0-9()+\-.\s]{6,30}$/.test(value),
      'Enter a valid phone number.'
    ),
  addressLine1: z.string().trim().min(4, 'Enter the street address.').max(140),
  addressLine2: z.string().trim().max(140).optional().default(''),
  city: z.string().trim().min(2, 'Enter the city.').max(80),
  state: z.string().trim().min(2, 'Enter the state or region.').max(80),
  postalCode: z.string().trim().min(3, 'Enter the postal code.').max(12),
  country: z.string().trim().min(2, 'Enter the country.').max(64),
});

export const createOrderSchema = z.object({
  /**
   * Optional. When omitted the signed-in customer's saved cart is used, which
   * is the normal checkout flow. "Buy now" passes the items explicitly.
   */
  items: z
    .array(
      z.object({
        productId: idSchema,
        quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
      })
    )
    .max(50)
    .optional(),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(PAYMENT_METHODS).default('CARD'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const orderIdParamSchema = z.object({
  id: idSchema,
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  /** `scope=all` lists every order and is reserved for administrators. */
  scope: z.enum(['mine', 'all']).default('mine'),
  page: paginationSchema.page,
  limit: paginationSchema.limit,
});


export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
