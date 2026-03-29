import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import webhookRoutes from './routes/webhook.routes.js';
import router from './routes/index.js';


const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// ─── Webhook routes FIRST (need raw body, before express.json()) ──────────────

app.use('/webhooks', webhookRoutes);

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use(
  morgan('combined', {
    stream: {
      write: (msg: string) => logger.info(msg.trim()),
    },
  }),
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', router)

// ─── Docs ────────────────────────────────────────────────────────────────────
setupSwagger(app);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Centralized error handler (must be last) ─────────────────────────────────

app.use(errorHandler);

export default app;
