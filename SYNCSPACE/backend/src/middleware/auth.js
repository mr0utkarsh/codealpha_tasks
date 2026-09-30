import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import prisma from "../lib/prisma.js";

const PUBLIC_USER_SELECT = { id: true, name: true, email: true, avatar: true, createdAt: true };
export { PUBLIC_USER_SELECT };

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized("Authentication required. Please log in.");
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET); }
  catch { throw ApiError.unauthorized("Session expired or invalid. Please log in again."); }
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: PUBLIC_USER_SELECT });
  if (!user) throw ApiError.unauthorized("This account no longer exists.");
  req.user = user;
  next();
});
export default requireAuth;
