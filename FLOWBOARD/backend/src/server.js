import { createApp } from './app.js';
import { env } from './config/env.js';
import prisma from './lib/prisma.js';

const app = createApp();

/** Fail fast with a helpful hint when PostgreSQL is not reachable. */
async function verifyDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[db] Connected to PostgreSQL.');
  } catch (error) {
    console.error(
      `\n[db] Could not connect to PostgreSQL: ${error.message}\n` +
        '     Start it with `npm run db:local` (or point DATABASE_URL at your own server).\n'
    );
    process.exit(1);
  }
}

await verifyDatabaseConnection();

const server = app.listen(env.PORT, () => {
  console.log(`\n  FLOWBOARD API ready at http://localhost:${env.PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}\n`);
});

/** Graceful shutdown closes the HTTP server and the Prisma pool. */
async function shutdown(signal) {
  console.log(`\n[api] ${signal} received - shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Safety net if a connection keeps the server open.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
