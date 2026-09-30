import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { TaskCard } from '../components/cards';
import { EmptyState } from '../components/feedback';
import { inputClass } from '../components/ui';

export function SearchPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const projects = await api.projects({ q });
        const hits = [];
        for (const p of projects.slice(0, 8)) {
          try {
            const tasks = await api.tasks(p.id, { q });
            for (const t of tasks.slice(0, 5)) hits.push({ project: p, task: t });
          } catch { /* skip inaccessible project */ }
        }
        setResults(hits.slice(0, 20));
        setSearched(true);
      } catch (err) {
        toast.error(err.message || 'Search failed.');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, toast]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Search</h1>
        <p className="mt-1 text-sm text-slate-500">Find tasks across every project you belong to.</p>
      </div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks by title or description…" aria-label="Search tasks" autoFocus className={`${inputClass} pl-9`} />
      </div>
      {query.trim().length >= 2 && searched && results.length === 0 && (
        <EmptyState icon={Search} title="No matches" message="Try different keywords, or check another project." />
      )}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map(({ project, task }) => (
            <div key={task.id}>
              <p className="mb-1.5 text-xs font-semibold text-slate-400">
                in <Link to={`/app/projects/${project.id}`} className="text-brand-600">{project.name}</Link>
              </p>
              <TaskCard task={task} onOpen={() => navigate(`/app/tasks/${task.id}`)} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold dark:text-white">This page drifted away</h1>
      <p className="mt-1.5 text-sm text-slate-500">The link may be broken, or the item may have been deleted.</p>
      <Link to="/app" className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">Back to dashboard</Link>
    </div>
  );
}
