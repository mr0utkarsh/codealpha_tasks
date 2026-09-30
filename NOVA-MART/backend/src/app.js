import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';

/**
 * Builds the Express application. Kept separate from `server.js` so the app can
 * be imported by tests without opening a port.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS - only the configured storefront origins may call the API. Requests
  // without an Origin header (curl, Postman, server-to-server) are allowed.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        const isAllowed =
          env.corsOrigins.includes(origin) ||
          // Any localhost port is fine while developing.
          (env.isDevelopment && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

        if (isAllowed) return callback(null, true);

        return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request logging
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // API
  app.use('/api', apiLimiter, routes);

  // 404 + error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
