-- Migration: 001_create_todo_table
-- Run this against your Neon / Supabase / Postgres database once.

CREATE TABLE IF NOT EXISTS todo (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
