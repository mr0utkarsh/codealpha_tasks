import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Issues a signed access token for a user.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} JWT
 */
export function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'nova-mart-api',
  });
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'nova-mart-api' });
}
