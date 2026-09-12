import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/query-builder.js';

describe('QueryBuilder', () => {
  type Todo = { id: number; title: string; completed: boolean };
  const qb = new QueryBuilder<Todo>('todo');

  // ── INSERT ─────────────────────────────────────────────────────────────────

  describe('buildInsert', () => {
    it('generates correct INSERT SQL', () => {
      const { sql, params } = qb.buildInsert({ title: 'Buy milk', completed: false });
      expect(sql).toBe(
        `INSERT INTO "todo" ("title", "completed") VALUES ($1, $2) RETURNING *`,
      );
      expect(params).toEqual(['Buy milk', false]);
    });

    it('throws when data is empty', () => {
      expect(() => qb.buildInsert({} as Omit<Todo, 'id'>)).toThrow();
    });
  });

  // ── SELECT ONE ─────────────────────────────────────────────────────────────

  describe('buildFindOne', () => {
    it('generates correct SELECT by id', () => {
      const { sql, params } = qb.buildFindOne(42);
      expect(sql).toBe(`SELECT * FROM "todo" WHERE "id" = $1 LIMIT 1`);
      expect(params).toEqual([42]);
    });
  });

  // ── SELECT MANY ────────────────────────────────────────────────────────────

  describe('buildFindMany', () => {
    it('generates SELECT * with no options', () => {
      const { sql, params } = qb.buildFindMany();
      expect(sql).toBe(`SELECT * FROM "todo"`);
      expect(params).toEqual([]);
    });

    it('generates WHERE clause', () => {
      const { sql, params } = qb.buildFindMany({ where: { completed: false } });
      expect(sql).toBe(`SELECT * FROM "todo" WHERE "completed" = $1`);
      expect(params).toEqual([false]);
    });

    it('generates ORDER BY clause', () => {
      const { sql } = qb.buildFindMany({ orderBy: { field: 'title', direction: 'asc' } });
      expect(sql).toContain('ORDER BY "title" ASC');
    });

    it('generates LIMIT / OFFSET', () => {
      const { sql, params } = qb.buildFindMany({ limit: 10, offset: 20 });
      expect(sql).toContain('LIMIT $1');
      expect(sql).toContain('OFFSET $2');
      expect(params).toEqual([10, 20]);
    });

    it('combines WHERE + ORDER + LIMIT', () => {
      const { sql, params } = qb.buildFindMany({
        where: { completed: true },
        orderBy: { field: 'title', direction: 'desc' },
        limit: 5,
      });
      expect(sql).toContain('WHERE "completed" = $1');
      expect(sql).toContain('ORDER BY "title" DESC');
      expect(sql).toContain('LIMIT $2');
      expect(params).toEqual([true, 5]);
    });
  });

  // ── UPDATE ─────────────────────────────────────────────────────────────────

  describe('buildUpdate', () => {
    it('generates correct UPDATE SQL', () => {
      const { sql, params } = qb.buildUpdate(1, { completed: true });
      expect(sql).toBe(`UPDATE "todo" SET "completed" = $1 WHERE "id" = $2 RETURNING *`);
      expect(params).toEqual([true, 1]);
    });

    it('throws when data is empty', () => {
      expect(() => qb.buildUpdate(1, {})).toThrow();
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  describe('buildDelete', () => {
    it('generates correct DELETE SQL', () => {
      const { sql, params } = qb.buildDelete(7);
      expect(sql).toBe(`DELETE FROM "todo" WHERE "id" = $1`);
      expect(params).toEqual([7]);
    });
  });

  // ── COUNT ──────────────────────────────────────────────────────────────────

  describe('buildCount', () => {
    it('generates COUNT with no filter', () => {
      const { sql, params } = qb.buildCount();
      expect(sql).toBe(`SELECT COUNT(*) as count FROM "todo"`);
      expect(params).toEqual([]);
    });

    it('generates COUNT with WHERE', () => {
      const { sql, params } = qb.buildCount({ completed: true });
      expect(sql).toContain('WHERE "completed" = $1');
      expect(params).toEqual([true]);
    });
  });
});
