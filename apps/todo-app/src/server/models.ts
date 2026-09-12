import { defineModel, number, string, boolean } from '@flam2/orm';

/**
 * Todo model definition.
 *
 * Maps to the SQL table:
 *   CREATE TABLE todo (
 *     id         SERIAL PRIMARY KEY,
 *     title      TEXT NOT NULL,
 *     completed  BOOLEAN NOT NULL DEFAULT false,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 * Note: `created_at` is not included in the ORM model because it is
 * automatically set by the database (DEFAULT NOW()) and should never
 * be supplied by the application on create/update.
 * It will still appear in SELECT * results as an extra property.
 */
export const TodoModel = defineModel('todo', {
  id: number(),
  title: string(),
  completed: boolean(),
});

/** Inferred TypeScript type for a Todo record (ORM-managed fields only). */
export type Todo = typeof TodoModel._inferredType;
