import { ApiError } from '../lib/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { createAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { serializeUser } from '../utils/serialize.js';

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
};

/**
 * A throwaway hash used to keep sign-in timing constant when the email does not
 * exist (mitigates account enumeration through response timing).
 */
let dummyHashPromise = null;
function getDummyHash() {
  dummyHashPromise ??= hashPassword('nova-mart-timing-equaliser');
  return dummyHashPromise;
}

/**
 * Registers a new customer and returns the created account plus a JWT.
 *
 * @param {{ name: string, email: string, password: string }} input
 */
export async function registerUser(input) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw ApiError.conflict('An account with that email already exists. Try signing in instead.');
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
    },
    select: { ...USER_FIELDS, password: true },
  });

  return { user: serializeUser(user), token: createAccessToken(user) };
}

/**
 * Verifies credentials and returns the account plus a JWT.
 *
 * @param {{ email: string, password: string }} input
 */
export async function loginUser(input) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { ...USER_FIELDS, password: true } });

  const invalidCredentials = ApiError.unauthorized('Email or password is incorrect.');

  if (!user) {
    await verifyPassword(input.password, await getDummyHash());
    throw invalidCredentials;
  }

  const passwordMatches = await verifyPassword(input.password, user.password);
  if (!passwordMatches) throw invalidCredentials;

  return { user: serializeUser(user), token: createAccessToken(user) };
}

/**
 * @param {string} userId
 */
export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_FIELDS });
  if (!user) throw ApiError.notFound('That account could not be found.');
  return serializeUser(user);
}

/**
 * @param {string} userId
 * @param {{ name?: string, phone?: string }} input
 */
export async function updateUserProfile(userId, input) {
  const data = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim() === '' ? null : input.phone.trim();

  const user = await prisma.user.update({ where: { id: userId }, data, select: USER_FIELDS });
  return serializeUser(user);
}

/**
 * @param {string} userId
 * @param {{ currentPassword: string, newPassword: string }} input
 */
export async function changeUserPassword(userId, input) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) throw ApiError.notFound('That account could not be found.');

  const matches = await verifyPassword(input.currentPassword, user.password);
  if (!matches) throw ApiError.badRequest('Your current password is not correct.');

  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(input.newPassword) },
  });

  return { updated: true };
}
