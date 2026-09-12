// Vercel serverless function entry point.
// Vercel calls this file for every /api/* request.
// We just export the Express app — Vercel wraps it automatically.
export { default } from '../src/server/app.js';
