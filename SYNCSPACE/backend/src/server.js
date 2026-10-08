import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import { initSocket } from "./socket/index.js";

const app = createApp();
const httpServer = createServer(app);
// Socket.IO must accept the same origins as the REST API: the configured
// allowlist (production Vercel origin) plus any localhost origin in dev.
const socketCors = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      env.corsOrigins.includes(origin) ||
      (env.isDevelopment && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
    if (isAllowed) return callback(null, true);
    return callback(new Error("Origin " + origin + " is not allowed by CORS."));
  },
  credentials: true,
};
const io = new Server(httpServer, {
  cors: socketCors,
  maxHttpBufferSize: 2e6,
});
initSocket(io);

async function verifyDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[db] Connected to PostgreSQL.");
  } catch (error) {
    console.error("\n[db] Could not connect to PostgreSQL: " + error.message + "\n     Start it with `npm run db:local`.\n");
    process.exit(1);
  }
}
await verifyDatabaseConnection();

const server = httpServer.listen(env.PORT, () => {
  console.log("\n  SYNCSPACE API ready at http://localhost:" + env.PORT);
  console.log("  Environment: " + env.NODE_ENV + "\n");
});

async function shutdown(signal) {
  console.log("\n[api] " + signal + " received - shutting down.");
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
