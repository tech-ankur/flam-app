// Local dev entry point — starts the Express server with app.listen()
// Vercel uses api/index.ts instead (no listen needed).
import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env['PORT'] ?? 3001);

// Serve React frontend in local dev / self-hosted production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Todo API running on http://localhost:${PORT}`);
});
