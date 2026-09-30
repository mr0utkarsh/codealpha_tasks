import { asyncHandler } from '../lib/asyncHandler.js';
import { created, message, ok } from '../lib/respond.js';
import * as orderService from '../services/order.service.js';

/** POST /api/orders */
export const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.validated.body);
  return created(res, { order }, `Order ${order.orderNumber} confirmed.`);
});

/** GET /api/orders - `?scope=all` is admin only */
export const list = asyncHandler(async (req, res) => {
  const wantsAll = req.validated.query.scope === 'all';
  const isAdmin = req.user.role === 'ADMIN';
  const { items, meta } = await orderService.listOrders(req.user.id, {
    status: req.validated.query.status,
    page: req.validated.query.page,
    limit: req.validated.query.limit,
    all: wantsAll && isAdmin,
  });
  return ok(res, items, meta);
});

/** GET /api/orders/stats */
export const stats = asyncHandler(async (req, res) => ok(res, await orderService.getOrderStats(req.user.id)));

/** GET /api/orders/:id */
export const detail = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.validated.params.id, {
    isAdmin: req.user.role === 'ADMIN',
  });
  return ok(res, { order });
});

/** PATCH /api/orders/:id/status - admin only */
export const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.validated.params.id, req.validated.body.status);
  return message(res, { order }, `Order marked as ${order.statusLabel.toLowerCase()}.`);
});

/** POST /api/orders/:id/cancel */
export const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.validated.params.id);
  return message(res, { order }, 'Your order has been cancelled and stock released.');
});
