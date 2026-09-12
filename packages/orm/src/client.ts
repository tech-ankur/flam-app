import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { ModelClient } from './model-client.js';
import type { DbExecutor } from './model-client.js';
import type { ModelDefinition } from './schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Type machinery: map a record of ModelDefinitions → record of ModelClients
// ─────────────────────────────────────────────────────────────────────────────

type ModelMap = Record<string, ModelDefinition<Record<string, unknown>>>;

/**
 * Given `{ todo: ModelDefinition<Todo> }` produces `{ todo: ModelClient<Todo> }`.
 */
type ClientMap<M extends ModelMap> = {
  [K in keyof M]: M[K] extends ModelDefinition<infer T> ? ModelClient<T> : never;
};

// ─────────────────────────────────────────────────────────────────────────────
// Transaction support
// ─────────────────────────────────────────────────────────────────────────────

/** A transaction context: model clients + raw execute — use inside $transaction(). */
export type TransactionClient<M extends ModelMap> = ClientMap<M> & {
  execute(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
};

// ─────────────────────────────────────────────────────────────────────────────
// OrmClient — the top-level object returned by createClient()
// ─────────────────────────────────────────────────────────────────────────────

export type OrmClient<M extends ModelMap> = ClientMap<M> & {
  /**
   * Execute a raw SQL query and return typed rows.
   * Use sparingly — prefer the model methods for type safety.
   */
  $raw<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<R[]>;

  /**
   * Run multiple operations together.
   * Note: Neon HTTP driver does not support interactive transactions;
   * this executes operations sequentially (documented limitation).
   * For true ACID transactions use the Neon WebSocket Pool driver.
   */
  $transaction<R>(fn: (tx: TransactionClient<M>) => Promise<R>): Promise<R>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Neon HTTP executor
// ─────────────────────────────────────────────────────────────────────────────

function createNeonExecutor(sqlFn: NeonQueryFunction<false, false>): DbExecutor {
  return {
    async query<R = Record<string, unknown>>(queryText: string, params: unknown[]): Promise<R[]> {
      // neon() returns a callable function: sql(query, params) → rows[]
      const rows = await sqlFn(queryText, params as any[]) as R[];
      return rows;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createClient — public entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a fully-typed ORM client backed by Neon serverless Postgres.
 *
 * @example
 * ```ts
 * import { createClient } from '@flam2/orm';
 * import { TodoModel } from './models.js';
 *
 * const db = createClient(process.env.DATABASE_URL, { todo: TodoModel });
 *
 * const todos = await db.todo.findMany({ where: { completed: false } });
 * ```
 */
export function createClient<M extends ModelMap>(
  connectionString: string,
  models: M,
): OrmClient<M> {
  if (!connectionString) {
    throw new Error('[orm] createClient requires a non-empty connectionString');
  }

  // Create the Neon HTTP function
  const sqlFn = neon(connectionString);
  const executor = createNeonExecutor(sqlFn);

  // Build one ModelClient per model definition
  const modelClients = {} as ClientMap<M>;
  for (const [key, definition] of Object.entries(models)) {
    (modelClients as Record<string, ModelClient<Record<string, unknown>>>)[key] =
      new ModelClient(definition, executor);
  }

  // Build the transaction helper
  async function $transaction<R>(fn: (tx: TransactionClient<M>) => Promise<R>): Promise<R> {
    // Neon HTTP does not support interactive transactions; runs sequentially.
    const txClient: TransactionClient<M> = {
      ...modelClients,
      execute: (sql: string, params: unknown[] = []) =>
        executor.query<Record<string, unknown>>(sql, params),
    };
    return fn(txClient);
  }

  return {
    ...modelClients,
    $raw<R = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<R[]> {
      return executor.query<R>(sql, params);
    },
    $transaction,
  };
}
