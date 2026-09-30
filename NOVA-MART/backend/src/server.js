import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  const mode = env.NODE_ENV.toUpperCase();
  console.log('\n  NOVA MART API');
  console.log('  ---------------------------------------------');
  console.log(`  Environment   ${mode}`);
  console.log(`  Listening on  http://localhost:${env.PORT}`);
  console.log(`  API base      http://localhost:${env.PORT}/api`);
  console.log(`  Health check  http://localhost:${env.PORT}/api/health`);
  console.log(`  CORS origins  ${env.corsOrigins.join(', ')}`);
  console.log('  ---------------------------------------------\n');
});

/**
 * Closes the HTTP server and the database connection before exiting so that
 * in-flight requests and PostgreSQL sockets are released cleanly.
 *
 * @param {string} signal
 */
async function shutdown(signal) {
  console.log(`\n[server] ${signal} received - shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error('[server] Forced exit after 10s.');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    await prisma.$disconnect();
    console.log('[server] Closed. Bye!');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught exception:', error);
  shutdown('uncaughtException');
});

export default server;
