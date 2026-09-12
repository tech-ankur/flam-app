import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve('../../apps/todo-app/.env');
const envText = readFileSync(envPath, 'utf8');
const match = envText.match(/^DATABASE_URL=(.+)$/m);
if (!match) { console.error('DATABASE_URL not found'); process.exit(1); }
const DATABASE_URL = match[1].trim();

const sql = neon(DATABASE_URL);
console.log('🔌 Connecting to Neon...');

const createTable = `CREATE TABLE IF NOT EXISTS todo (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql(createTable, []);
console.log('✅ Migration complete — "todo" table is ready.');
