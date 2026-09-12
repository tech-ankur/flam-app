import type { Router, Request, Response } from 'express';
import { Router as createRouter } from 'express';
import { createClient } from '@flam2/orm';
import { TodoModel } from './models.js';

// ─── DB setup ────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = createClient(DATABASE_URL, { todo: TodoModel });

// ─── Router ──────────────────────────────────────────────────────────────────

export function createTodoRouter(): Router {
  const router = createRouter();

  /**
   * GET /api/todos
   * Query params: ?completed=true|false
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { completed } = req.query;

      const todos = await db.todo.findMany({
        ...(completed !== undefined && { where: { completed: completed === 'true' } }),
        orderBy: { field: 'id', direction: 'desc' },
      });
      res.json({ data: todos });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  /**
   * GET /api/todos/:id
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params['id']);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const todo = await db.todo.findOne(id);
      if (!todo) return res.status(404).json({ error: 'Not found' });
      res.json({ data: todo });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  /**
   * POST /api/todos
   * Body: { title: string, completed?: boolean }
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, completed = false } = req.body as { title?: string; completed?: boolean };
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: '"title" is required and must be a string' });
      }
      const todo = await db.todo.create({ title, completed });
      res.status(201).json({ data: todo });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  /**
   * PATCH /api/todos/:id
   * Body: Partial<{ title, completed }>
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params['id']);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { title, completed } = req.body as { title?: string; completed?: boolean };
      const todo = await db.todo.update(id, {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      });
      res.json({ data: todo });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  /**
   * DELETE /api/todos/:id
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params['id']);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      await db.todo.delete(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
