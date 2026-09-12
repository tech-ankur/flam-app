// ─────────────────────────────────────────────────────────────────────────────
// QueryBuilder — translates ORM method calls into parameterised SQL strings.
//
// Design goals:
//   - Zero external dependencies (no query-builder library)
//   - Parameterised queries only (safe against SQL injection)
//   - Fully typed — the generic T is the inferred model shape
// ─────────────────────────────────────────────────────────────────────────────

export interface CompiledQuery {
  sql: string;
  params: unknown[];
}

export interface WhereClause<T> {
  where?: Partial<T>;
}

export interface OrderByClause<T> {
  orderBy?: { field: keyof T; direction?: 'asc' | 'desc' };
}

export interface PaginationClause {
  limit?: number;
  offset?: number;
}

export type FindManyOptions<T> = WhereClause<T> & OrderByClause<T> & PaginationClause;

/**
 * Builds parameterised SQL for a single model/table.
 * Knows nothing about the DB driver — just produces `{ sql, params }`.
 */
export class QueryBuilder<T extends Record<string, unknown>> {
  constructor(private readonly tableName: string) {}

  // ── INSERT ──────────────────────────────────────────────────────────────────

  buildInsert(data: Omit<T, 'id'>): CompiledQuery {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (entries.length === 0) {
      throw new Error(`[orm] Cannot insert a record with no fields into "${this.tableName}"`);
    }

    const columns = entries.map(([k]) => `"${k}"`).join(', ');
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
    const params = entries.map(([, v]) => v);

    return {
      sql: `INSERT INTO "${this.tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`,
      params,
    };
  }

  // ── SELECT (single) ─────────────────────────────────────────────────────────

  buildFindOne(id: number | string): CompiledQuery {
    return {
      sql: `SELECT * FROM "${this.tableName}" WHERE "id" = $1 LIMIT 1`,
      params: [id],
    };
  }

  // ── SELECT (many) ───────────────────────────────────────────────────────────

  buildFindMany(options: FindManyOptions<T> = {}): CompiledQuery {
    const { where, orderBy, limit, offset } = options;
    const parts: string[] = [`SELECT * FROM "${this.tableName}"`];
    const params: unknown[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => {
          params.push(v);
          return `"${k}" = $${params.length}`;
        });
      if (conditions.length > 0) {
        parts.push(`WHERE ${conditions.join(' AND ')}`);
      }
    }

    if (orderBy) {
      const dir = orderBy.direction === 'desc' ? 'DESC' : 'ASC';
      parts.push(`ORDER BY "${String(orderBy.field)}" ${dir}`);
    }

    if (limit !== undefined) {
      params.push(limit);
      parts.push(`LIMIT $${params.length}`);
    }

    if (offset !== undefined) {
      params.push(offset);
      parts.push(`OFFSET $${params.length}`);
    }

    return { sql: parts.join(' '), params };
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────

  buildUpdate(id: number | string, data: Partial<Omit<T, 'id'>>): CompiledQuery {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (entries.length === 0) {
      throw new Error(`[orm] Cannot update "${this.tableName}" with no fields`);
    }

    const params: unknown[] = [];
    const setClauses = entries.map(([k, v]) => {
      params.push(v);
      return `"${k}" = $${params.length}`;
    });
    params.push(id);

    return {
      sql: `UPDATE "${this.tableName}" SET ${setClauses.join(', ')} WHERE "id" = $${params.length} RETURNING *`,
      params,
    };
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────

  buildDelete(id: number | string): CompiledQuery {
    return {
      sql: `DELETE FROM "${this.tableName}" WHERE "id" = $1`,
      params: [id],
    };
  }

  // ── COUNT ────────────────────────────────────────────────────────────────────

  buildCount(where?: Partial<T>): CompiledQuery {
    const params: unknown[] = [];
    let sql = `SELECT COUNT(*) as count FROM "${this.tableName}"`;

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => {
          params.push(v);
          return `"${k}" = $${params.length}`;
        });
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    return { sql, params };
  }
}
