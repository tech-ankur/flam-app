// ─────────────────────────────────────────────────────────────────────────────
// Thin fetch wrapper — keeps components clean of raw fetch boilerplate.
// Base URL is auto-detected: dev proxy vs same-origin prod.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/api/todos';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json() as { data?: T; error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data as T;
}

export const api = {
  list: (completed?: boolean) => {
    const qs = completed !== undefined ? `?completed=${completed}` : '';
    return request<Todo[]>(`/${qs}`);
  },
  create: (title: string) =>
    request<Todo>('/', {
      method: 'POST',
      body: JSON.stringify({ title, completed: false }),
    }),
  complete: (id: number, completed: boolean) =>
    request<Todo>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  remove: (id: number) =>
    request<void>(`/${id}`, { method: 'DELETE' }),
};
