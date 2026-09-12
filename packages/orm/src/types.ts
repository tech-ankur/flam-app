// ─────────────────────────────────────────────────────────────────────────────
// Core type primitives for the ORM field system.
// Each field factory returns a FieldDef<T> carrying the TypeScript type as a
// phantom type — it is only used at compile time and has no runtime overhead.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A field definition carries a phantom TypeScript type `T`.
 * Runtime value is just `{ _kind }` for introspection.
 */
export interface FieldDef<T> {
  readonly _type: T; // phantom — never actually present at runtime
  readonly _kind: 'string' | 'number' | 'boolean' | 'date';
  readonly _optional: boolean;
  readonly _nullable: boolean;
}

/** Infer the plain TypeScript shape of a field-map object. */
export type InferModel<F extends FieldMap> = {
  [K in keyof F]: InferField<F[K]>;
};

type InferField<F extends FieldDef<unknown>> =
  F['_nullable'] extends true
    ? F['_optional'] extends true
      ? F['_type'] | null | undefined
      : F['_type'] | null
    : F['_optional'] extends true
    ? F['_type'] | undefined
    : F['_type'];

/** A map of field names to their definitions. */
export type FieldMap = Record<string, FieldDef<unknown>>;

// ─── Field factories ──────────────────────────────────────────────────────────

function makeField<T>(kind: FieldDef<T>['_kind']): FieldDef<T> {
  // We cast because _type is phantom (never assigned a real value).
  return { _kind: kind, _optional: false, _nullable: false } as unknown as FieldDef<T>;
}

/** Define a number field (maps to SQL INTEGER / NUMERIC). */
export function number(): FieldDef<number> {
  return makeField<number>('number');
}

/** Define a string field (maps to SQL TEXT / VARCHAR). */
export function string(): FieldDef<string> {
  return makeField<string>('string');
}

/** Define a boolean field (maps to SQL BOOLEAN). */
export function boolean(): FieldDef<boolean> {
  return makeField<boolean>('boolean');
}

/** Define a Date field (maps to SQL TIMESTAMPTZ). */
export function date(): FieldDef<Date> {
  return makeField<Date>('date');
}

// ─── Column-level metadata used by the query builder ─────────────────────────

export interface ColumnMeta {
  kind: FieldDef<unknown>['_kind'];
  optional: boolean;
  nullable: boolean;
}

export function getColumnMeta(field: FieldDef<unknown>): ColumnMeta {
  return {
    kind: field._kind,
    optional: field._optional,
    nullable: field._nullable,
  };
}
