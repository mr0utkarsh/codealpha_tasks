import { created, message, ok } from '../lib/respond.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authService from '../services/auth.service.js';

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.validated.body);
  return created(res, result, `Welcome to NOVA MART, ${result.user.name.split(' ')[0]}!`);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.validated.body);
  return message(res, result, `Welcome back, ${result.user.name.split(' ')[0]}!`);
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  return ok(res, { user });
});

/** PATCH /api/auth/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateUserProfile(req.user.id, req.validated.body);
  return message(res, { user }, 'Your details have been saved.');
});

/** POST /api/auth/change-password */
export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changeUserPassword(req.user.id, req.validated.body);
  return message(res, result, 'Your password has been updated.');
});
