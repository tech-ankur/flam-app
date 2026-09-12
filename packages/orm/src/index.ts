// ─────────────────────────────────────────────────────────────────────────────
// @flam2/orm — public API surface
// ─────────────────────────────────────────────────────────────────────────────

// Schema definition
export { defineModel } from './schema.js';
export type { ModelDefinition } from './schema.js';

// Field factories
export { number, string, boolean, date } from './types.js';
export type { FieldDef, FieldMap, InferModel } from './types.js';

// Query builder (for advanced / raw use)
export { QueryBuilder } from './query-builder.js';
export type { CompiledQuery, FindManyOptions, WhereClause, OrderByClause, PaginationClause } from './query-builder.js';

// Model client
export { ModelClient } from './model-client.js';
export type { DbExecutor } from './model-client.js';

// Top-level client factory
export { createClient } from './client.js';
export type { OrmClient, TransactionClient } from './client.js';
