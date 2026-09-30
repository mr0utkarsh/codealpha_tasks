import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Signs a JWT for the given user id. */
export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export default signToken;
