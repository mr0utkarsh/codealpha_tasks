import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import prisma from "../lib/prisma.js";
import { created, ok } from "../lib/respond.js";
import { PUBLIC_USER_SELECT } from "../middleware/auth.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("An account with this email already exists.");
  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
    select: PUBLIC_USER_SELECT,
  });
  created(res, { token: signToken(user.id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw ApiError.unauthorized("Invalid email or password.");
  }
  const safeUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt };
  ok(res, { token: signToken(user.id), user: safeUser });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, { user: req.user });
});
