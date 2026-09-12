# Architecture

This document explains the internal design of `@flam2/orm`.

---

## Module Structure

```
packages/orm/src/
├── types.ts          — FieldDef<T> phantom types, field factories
├── schema.ts         — defineModel(), ModelDefinition<T>
├── query-builder.ts  — QueryBuilder<T> (pure SQL generation)
├── model-client.ts   — ModelClient<T> (CRUD + validation)
├── client.ts         — createClient() (driver wiring + type mapping)
└── index.ts          — Public API barrel
```

---

## How Models Are Defined

```ts
const Todo = defineModel("todo", {
  id:        number(),
  title:     string(),
  completed: boolean(),
});
```

Each field factory (e.g. `number()`) returns a `FieldDef<T>` — an object carrying:

1. **A phantom TypeScript type** (`T` = `number` / `string` / `boolean`) — used only at compile time, erased at runtime.
2. **A `_kind` string** (`'number'` / `'string'` / `'boolean'` / `'date'`) — used at runtime for validation.

`defineModel` takes these and:
- Computes `InferModel<F>` — the plain TypeScript shape `{ id: number; title: string; completed: boolean }`.
- Stores runtime `ColumnMeta` for each field (used by the validator in `model-client.ts`).
- Returns a `ModelDefinition<T>` that carries the inferred type as a phantom.

---

## How Types Are Inferred

```
FieldDef<number>   ──→  "id" field is typed as number
FieldDef<string>   ──→  "title" field is typed as string
FieldDef<boolean>  ──→  "completed" field is typed as boolean
         ↓
InferModel<{ id: FieldDef<number>; title: FieldDef<string>; completed: FieldDef<boolean> }>
         ↓
{ id: number; title: string; completed: boolean }
         ↓
ModelDefinition<{ id: number; title: string; completed: boolean }>
         ↓
createClient(url, { todo: TodoModel })
         ↓
db.todo: ModelClient<{ id: number; title: string; completed: boolean }>
         ↓
db.todo.create({ title: "Buy milk", completed: false })  // ✓ typed
db.todo.create({ badField: "oops" })                      // ✗ TypeScript error
```

The key generic chain is:

```ts
// In createClient:
type ClientMap<M extends ModelMap> = {
  [K in keyof M]: M[K] extends ModelDefinition<infer T> ? ModelClient<T> : never;
};
```

This maps each key of the model map to a `ModelClient` typed with the correct inferred shape — without the caller specifying any explicit types.

---

## Query Flow

```
User API call
    │
    ▼
ModelClient<T>.findMany({ where: { completed: false } })
    │
    │  1. validateData() — runtime type check on input
    │
    ▼
QueryBuilder<T>.buildFindMany({ where: { completed: false } })
    │
    │  2. Pure function: builds SQL string + params array
    │     → "SELECT * FROM "todo" WHERE "completed" = $1"
    │        params: [false]
    │
    ▼
DbExecutor.query(sql, params)
    │
    │  3. Neon HTTP driver executes against Postgres
    │
    ▼
rows: Record<string, unknown>[]
    │
    │  4. Cast to T[] (QueryBuilder guarantees shape via RETURNING *)
    │
    ▼
Return: Todo[]
```

---

## Driver Abstraction

`ModelClient` depends only on:

```ts
interface DbExecutor {
  query<R>(sql: string, params: unknown[]): Promise<R[]>;
}
```

This is injected by `createClient`. To swap drivers (e.g. to `pg` for local dev):

```ts
import { Pool } from 'pg';

const pool = new Pool({ connectionString });
const pgExecutor: DbExecutor = {
  query: (sql, params) => pool.query(sql, params).then(r => r.rows),
};
```

---

## Package Design

The package exposes a clean public API via `index.ts`:
- **Consumers need only `import { createClient, defineModel, ... } from '@flam2/orm'`**
- Internal modules (`query-builder.ts`, `model-client.ts`, etc.) are not exported by name — only their types are selectively re-exported for advanced use cases.
- The `exports` map in `package.json` enforces this boundary.

---

## Known Limitations

| Area | Limitation | Notes |
|---|---|---|
| Relations | No JOIN support | Would require a separate `include` / `populate` API |
| Operators | Equality only | No `LIKE`, `IN`, `>`, `<` etc. |
| Migrations | Manual SQL only | No programmatic migration runner |
| Transactions | Sequential on Neon HTTP | True ACID txns need WebSocket pool |
| Composite PKs | Assumes single `id` column | Extending to composite keys is straightforward |

---

## What Would Scale

1. **Relation support** — add `hasMany`, `belongsTo` to `ModelDefinition` and a `JOIN` builder in `QueryBuilder`.
2. **Advanced operators** — extend `WhereClause<T>` to support `{ completed: { eq: false } }` or `{ title: { like: '%milk%' } }`.
3. **Migration CLI** — walk `ModelDefinition.columns` to generate `CREATE TABLE` DDL automatically.
4. **Connection pooling** — accept a `pg.Pool` or `neon.Pool` instead of a connection string.
5. **Middleware / hooks** — `beforeCreate`, `afterUpdate` hooks on `ModelClient`.
