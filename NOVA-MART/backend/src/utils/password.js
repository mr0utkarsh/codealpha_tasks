import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hashes a plain text password with bcrypt. Plain passwords are never stored.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

/**
 * Compares a plain text password against a stored bcrypt hash.
 *
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
