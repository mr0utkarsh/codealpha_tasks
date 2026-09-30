#!/usr/bin/env node
/**
 * Optional zero-install PostgreSQL for local development.
 *
 * Uses `embedded-postgres` (a dev-only dependency) to run a real PostgreSQL
 * server inside `backend/.pgdata`, so the project can be started even when
 * Docker or a system PostgreSQL installation is unavailable.
 *
 *   npm run db:local          # start it and keep it running (Ctrl+C to stop)
 *   npm run db:local:status   # check whether it is running
 *   npm run db:local:stop     # stop a running instance
 *
 * This script is a convenience only - point DATABASE_URL at any PostgreSQL
 * instance (local, Docker or managed) and skip it entirely.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DATA_DIR = path.join(backendRoot, '.pgdata');
const POSTMASTER_PID_FILE = path.join(DATA_DIR, 'postmaster.pid');
const DEFAULT_PORT = Number(process.env.LOCAL_DB_PORT || 55434);
const DATABASE_NAME = 'syncspace';

function loadEmbeddedPostgres() {
  try {
    const imported = require('embedded-postgres');
    const EmbeddedPostgres = imported?.default ?? imported;
    if (typeof EmbeddedPostgres !== 'function') throw new Error('unexpected module shape');
    return EmbeddedPostgres;
  } catch (error) {
    console.error(
      '\n[db:local] The optional dependency `embedded-postgres` is unavailable ' +
        `(${error.message}).\n` +
        '           Run `npm install` inside /backend, or start PostgreSQL yourself:\n' +
        '             docker compose up -d\n'
    );
    process.exit(1);
  }
}

function readPostmasterPid() {
  if (!fs.existsSync(POSTMASTER_PID_FILE)) return null;
  const [pid] = fs.readFileSync(POSTMASTER_PID_FILE, 'utf8').split(/\r?\n/);
  const value = Number(pid);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function connectionUrl() {
  return `postgresql://postgres:postgres@127.0.0.1:${DEFAULT_PORT}/${DATABASE_NAME}?schema=public`;
}

/**
 * Makes sure the store database exists. Works whether or not this process
 * started the cluster.
 *
 * @param {import('embedded-postgres').default} server
 */
async function ensureDatabase(server) {
  try {
    await server.createDatabase(DATABASE_NAME);
    return true;
  } catch (error) {
    const message = String(error?.message ?? error);
    if (/already exists/i.test(message)) return true;

    // Fall back to a direct check through node-postgres (the client bundled
    // with embedded-postgres) - this also covers "cluster already running".
    try {
      const client = server.getPgClient('postgres', '127.0.0.1');
      await client.connect();
      const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
        DATABASE_NAME,
      ]);
      if (existing.rowCount === 0) {
        await client.query(`CREATE DATABASE "${DATABASE_NAME}"`);
      }
      await client.end();
      return true;
    } catch (fallbackError) {
      console.warn(
        `[db:local] Could not verify/create the database automatically: ${fallbackError.message}`
      );
      return false;
    }
  }
}

async function start() {
  const EmbeddedPostgres = loadEmbeddedPostgres();
  const server = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: DEFAULT_PORT,
    persistent: true,
    onLog: () => {},
    onError: (error) => {
      const message = String(error?.message ?? error).trim();
      if (message) console.error(`[db:local][postgres] ${message}`);
    },
  });

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const runningPid = readPostmasterPid();
  const isInitialised = fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));

  if (isProcessAlive(runningPid)) {
    console.log(
      `[db:local] PostgreSQL is already running (pid ${runningPid}, port ${DEFAULT_PORT}).`
    );
  } else {
    if (!isInitialised) {
      console.log('[db:local] Initialising a fresh PostgreSQL cluster (one time only)...');
      await server.initialise();
    }
    console.log('[db:local] Starting PostgreSQL...');
    await server.start();
  }

  const created = await ensureDatabase(server);
  if (created) {
    console.log(`[db:local] Database "${DATABASE_NAME}" is ready.`);
  }

  console.log('\n---------------------------------------------');
  console.log('  Local PostgreSQL is running');
  console.log('---------------------------------------------');
  console.log('  DATABASE_URL for backend/.env:\n');
  console.log(`  ${connectionUrl()}\n`);
  console.log('  Leave this process running and start the API in a');
  console.log('  second terminal with:  npm run dev');
  console.log('  Press Ctrl+C to stop PostgreSQL.');
  console.log('---------------------------------------------\n');

  // Keep this Node process (and therefore the server) alive until interrupted.
  const keepAlive = setInterval(() => {}, 2 ** 30);

  const shutdown = async (signal) => {
    console.log(`\n[db:local] ${signal} received - stopping PostgreSQL...`);
    clearInterval(keepAlive);
    try {
      await server.stop();
      console.log('[db:local] Stopped. Your data is preserved in backend/.pgdata.');
    } catch (error) {
      console.error(`[db:local] Could not stop cleanly: ${error.message}`);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

function stop() {
  const pid = readPostmasterPid();

  if (!pid || !isProcessAlive(pid)) {
    console.log('[db:local] Nothing to stop - no running instance was found.');
    return;
  }

  console.log(`[db:local] Stopping PostgreSQL (pid ${pid})...`);
  try {
    process.kill(pid);
    console.log('[db:local] Stop signal sent. Data is preserved in backend/.pgdata.');
  } catch (error) {
    console.error(`[db:local] Failed to stop pid ${pid}: ${error.message}`);
    process.exitCode = 1;
  }
}

function status() {
  const pid = readPostmasterPid();

  if (pid && isProcessAlive(pid)) {
    console.log(`[db:local] Running (pid ${pid}, port ${DEFAULT_PORT}).`);
    console.log(`[db:local] ${connectionUrl()}`);
    return;
  }

  console.log('[db:local] Stopped.');
}

const commands = { start, stop, status };
const command = process.argv[2] || 'start';

if (!commands[command]) {
  console.error(`[db:local] Unknown command "${command}". Use: start | stop | status`);
  process.exit(1);
}

Promise.resolve(commands[command]()).catch((error) => {
  console.error(`[db:local] ${error?.message ?? error}`);
  process.exit(1);
});
