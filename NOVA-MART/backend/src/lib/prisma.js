import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * A single Prisma client instance is shared across the process. During local
 * development the instance is cached on `globalThis` so `node --watch` restarts
 * do not exhaust database connections.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__novaMartPrisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (!env.isProduction) {
  globalForPrisma.__novaMartPrisma = prisma;
}

export default prisma;
