import type { FieldMap, InferModel } from './types.js';
import { getColumnMeta } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema / Model definition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A model definition carries:
 * - `tableName`  — the SQL table this model maps to
 * - `fields`     — the raw FieldDef map (runtime introspection)
 * - The phantom type parameter `T` (= InferModel<F>) so downstream generics
 *   can infer the full TypeScript shape without repeating the field map.
 */
export interface ModelDefinition<T extends Record<string, unknown>, F extends FieldMap = FieldMap> {
  readonly tableName: string;
  readonly fields: F;
  /** Column metadata indexed by field name — used by QueryBuilder. */
  readonly columns: Record<string, ReturnType<typeof getColumnMeta>>;
  /** Phantom type anchor — never assigned at runtime. */
  readonly _inferredType: T;
}

/**
 * Define a model.
 *
 * @example
 * ```ts
 * const Todo = defineModel("todo", {
 *   id:        number(),
 *   title:     string(),
 *   completed: boolean(),
 * });
 * ```
 */
export function defineModel<F extends FieldMap>(
  tableName: string,
  fields: F,
): ModelDefinition<InferModel<F>, F> {
  const columns: Record<string, ReturnType<typeof getColumnMeta>> = {};
  for (const [key, field] of Object.entries(fields)) {
    columns[key] = getColumnMeta(field);
  }

  return {
    tableName,
    fields,
    columns,
    // Phantom — TypeScript uses this only at the type level.
    _inferredType: undefined as unknown as InferModel<F>,
  };
}
