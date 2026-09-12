import { useState, useEffect, useCallback } from 'react';
import { api, type Todo } from './api';

// ─── Filter type ──────────────────────────────────────────────────────────────
type Filter = 'all' | 'active' | 'completed';

// ─── TodoItem component ───────────────────────────────────────────────────────
function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <button
        className="toggle-btn"
        onClick={() => onToggle(todo.id, !todo.completed)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed ? '✓' : '○'}
      </button>
      <span className="todo-title">{todo.title}</span>
      <button
        className="delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label="Delete todo"
      >
        ✕
      </button>
    </li>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derive the completed filter param for the API
  const completedParam =
    filter === 'all' ? undefined : filter === 'completed' ? true : false;

  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      const data = await api.list(completedParam);
      setTodos(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [completedParam]);

  useEffect(() => {
    setLoading(true);
    void loadTodos();
  }, [loadTodos]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    try {
      setSubmitting(true);
      const todo = await api.create(title);
      setTodos((prev) => [todo, ...prev]);
      setInput('');
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      const updated = await api.complete(id, completed);
      setTodos((prev) =>
        filter === 'all'
          ? prev.map((t) => (t.id === id ? updated : t))
          : prev.filter((t) => t.id !== id),
      );
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.remove(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(String(e));
    }
  };

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="app">
      <header className="header">
        <h1>✅ Todo App</h1>
        <p className="subtitle">Powered by <strong>@ankur1/orm</strong></p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Create form */}
      <form className="create-form" onSubmit={handleCreate}>
        <input
          className="create-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
          disabled={submitting}
          autoFocus
        />
        <button className="create-btn" type="submit" disabled={submitting || !input.trim()}>
          {submitting ? '…' : 'Add'}
        </button>
      </form>

      {/* Filter tabs */}
      <div className="filters" role="tablist">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Todo list */}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : todos.length === 0 ? (
        <div className="empty">
          {filter === 'all' ? 'No todos yet — add one above!' : `No ${filter} todos.`}
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* Footer stats */}
      {todos.length > 0 && (
        <footer className="footer">
          <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
        </footer>
      )}
    </div>
  );
}
