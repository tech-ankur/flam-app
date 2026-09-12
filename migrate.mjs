// migrate.mjs — runs the todo table migration using @neondatabase/serverless
// Usage: node migrate.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env manually (no dotenv needed)
const envPath = resolve(__dirname, 'apps/todo-app/.env');
const envText = readFileSync(envPath, 'utf8');
const match = envText.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error('❌ DATABASE_URL not found in apps/todo-app/.env');
  process.exit(1);
}
const DATABASE_URL = match[1].trim();

const sql = neon(DATABASE_URL);

const migration = `
  CREATE TABLE IF NOT EXISTS todo (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

console.log('🔌 Connecting to Neon...');
try {
  await sql(migration, []);
  console.log('✅ Migration complete — "todo" table is ready.');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
