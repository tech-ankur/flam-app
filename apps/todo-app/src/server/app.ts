import express, { type Express } from 'express';
import cors from 'cors';
import { createTodoRouter } from './routes.js';

// ─── Express app (exported for Vercel serverless + local dev) ─────────────────
const app: Express = express();

app.use(cors());
app.use(express.json());

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/todos', createTodoRouter());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
