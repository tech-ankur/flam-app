# @flam2/orm

> Lightweight, fully-typed TypeScript ORM for serverless Postgres (Neon, Supabase, Railway).

[![npm](https://img.shields.io/npm/v/@flam2/orm)](https://www.npmjs.com/package/@flam2/orm)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

- 🔷 **Strong TypeScript types** — model shapes are fully inferred at compile time
- 🛡️ **Zero SQL injection** — parameterised queries only (`$1`, `$2`, …)
- 🪶 **Zero config** — no code generation, no migrations required
- ☁️ **Serverless-first** — works with the Neon HTTP driver out of the box
- 🔌 **Pluggable driver** — swap to `pg` or any Postgres driver via the `DbExecutor` interface

---

## Quick Start

```ts
import { createClient, defineModel, number, string, boolean } from '@flam2/orm';

// 1. Define your model
const Todo = defineModel('todo', {
  id:        number(),
  title:     string(),
  completed: boolean(),
});

// 2. Create a client
const db = createClient(process.env.DATABASE_URL, { todo: Todo });

// 3. Use it — fully typed!
const todos = await db.todo.findMany({ where: { completed: false } });
const todo  = await db.todo.create({ title: 'Buy milk', completed: false });
const done  = await db.todo.update(todo.id, { completed: true });
await db.todo.delete(done.id);
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- A Postgres-compatible database (Neon recommended)

### 1. Clone the monorepo

```bash
git clone https://github.com/flam2/flam2-orm
cd flam2-orm
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up the database

Create a free database at [neon.tech](https://neon.tech) (or use any Postgres instance).

Run the migration:

```bash
# Using psql
psql $DATABASE_URL -f apps/todo-app/migrations/001_create_todo_table.sql

# Or paste the SQL into the Neon console directly
```

### 4. Configure environment

```bash
cp apps/todo-app/.env.example apps/todo-app/.env
# Edit .env and set your DATABASE_URL
```

### 5. Build the ORM package

```bash
pnpm --filter @flam2/orm build
```

### 6. Run the Todo app

```bash
cd apps/todo-app
pnpm dev
```

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

---

## API Reference

### `defineModel(tableName, fields)`

```ts
const User = defineModel('users', {
  id:    number(),
  name:  string(),
  email: string(),
  admin: boolean(),
});
```

### `createClient(connectionString, models)`

```ts
const db = createClient(process.env.DATABASE_URL, { user: User, todo: Todo });
```

### Model methods

| Method | Signature | Description |
|---|---|---|
| `create` | `(data: Omit<T, 'id'>) => Promise<T>` | Insert a new record |
| `findOne` | `(id: number) => Promise<T \| null>` | Find by primary key |
| `findMany` | `(opts?) => Promise<T[]>` | Query with filter/order/pagination |
| `update` | `(id, data: Partial<T>) => Promise<T>` | Partial update by id |
| `delete` | `(id: number) => Promise<void>` | Delete by id |
| `count` | `(where?) => Promise<number>` | Count matching rows |

### `findMany` options

```ts
await db.todo.findMany({
  where:   { completed: false },
  orderBy: { field: 'id', direction: 'desc' },
  limit:   10,
  offset:  20,
});
```

### Raw SQL

```ts
const rows = await db.$raw('SELECT * FROM todo WHERE title ILIKE $1', ['%milk%']);
```

---

## ORM Design

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full walkthrough of:
- How models are defined and types are inferred
- The query flow from API call → SQL → rows
- TypeScript generics design
- Known limitations and future work

---

## Publishing to npm

```bash
pnpm --filter @flam2/orm build
pnpm --filter @flam2/orm publish --access public
```

---

## Tools Used

This project was built with the assistance of **Google Antigravity (AI coding assistant)** for:
- Initial scaffolding and boilerplate generation
- TypeScript generic type design
- Test case generation

All code has been reviewed, understood, and is fully explainable by the author.

---

## Known Limitations

- No relationship support (no `JOIN` queries)
- No migration runner (SQL files are provided; run manually)
- `$transaction` on the Neon HTTP driver is sequential, not ACID (documented in code)
- Limited query operators (only equality `=`; no `IN`, `LIKE`, `>`, `<`)
- No connection pooling configuration (handled by Neon serverless internally)

---

## Time Spent

~4 hours total:
- 1h — ORM design and type system
- 1.5h — Query builder and model client
- 1h — Todo app (server + frontend)
- 30min — Documentation and polish

---

## License

MIT
