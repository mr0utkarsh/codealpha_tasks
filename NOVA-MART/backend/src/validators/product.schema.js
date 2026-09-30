import { z } from 'zod';
import { idSchema, moneySchema, optionalBoolean, paginationSchema } from './common.js';

const IMAGE_URL_PATTERN = /^https?:\/\/[^\s]+$/i;

const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => IMAGE_URL_PATTERN.test(value), 'Provide a valid image URL.');

export const PRODUCT_SORTS = [
  'relevance',
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'popularity',
  'name-asc',
  'name-desc',
];


export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  brand: z.string().trim().max(60).optional(),
  /** Comma separated list of product ids - used to hydrate carts and wishlists. */
  ids: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
            .slice(0, 60)
        : undefined
    ),
  minPrice: moneySchema.optional(),
  maxPrice: moneySchema.optional(),
  sort: z.enum(PRODUCT_SORTS).default('relevance'),
  page: paginationSchema.page,
  limit: paginationSchema.limit,
  inStock: optionalBoolean,
  featured: optionalBoolean,
  trending: optionalBoolean,
});


export const productIdParamSchema = z.object({
  id: idSchema,
});

export const createProductSchema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters.').max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.')
    .max(160)
    .optional(),
  brand: z.string().trim().min(1, 'Brand is required.').max(80),
  description: z.string().trim().min(20, 'Describe the product in at least 20 characters.').max(2000),
  category: z.string().trim().min(2, 'Category is required.').max(60),
  price: moneySchema.refine((value) => value > 0, 'Price must be greater than zero.'),
  comparePrice: moneySchema.nullable().optional(),
  image: imageUrlSchema,
  images: z.array(imageUrlSchema).max(8).optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.').max(100000).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
});


export const updateProductSchema = createProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update.'
);
