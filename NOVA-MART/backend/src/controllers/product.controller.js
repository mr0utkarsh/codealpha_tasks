import { asyncHandler } from '../lib/asyncHandler.js';
import { created, message, ok } from '../lib/respond.js';
import * as productService from '../services/product.service.js';

/** GET /api/products */
export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.validated.query);
  return ok(res, items, meta);
});

/** GET /api/products/categories */
export const categories = asyncHandler(async (_req, res) => {
  const items = await productService.listCategories();
  return ok(res, items);
});

/** GET /api/products/summary */
export const summary = asyncHandler(async (_req, res) => {
  const data = await productService.getCatalogSummary();
  return ok(res, data);
});

/** GET /api/products/:id - accepts a product id or slug */
export const detail = asyncHandler(async (req, res) => {
  const data = await productService.getProductDetail(req.validated.params.id);
  return ok(res, data);
});

/** POST /api/products - admin only */
export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.validated.body);
  return created(res, { product }, 'Product created.');
});

/** PUT /api/products/:id - admin only */
export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.validated.params.id, req.validated.body);
  return message(res, { product }, 'Product updated.');
});

/** DELETE /api/products/:id - admin only */
export const remove = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.validated.params.id);
  return message(res, result, 'Product deleted.');
});
