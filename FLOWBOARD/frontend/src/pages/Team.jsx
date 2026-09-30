import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Avatar, AvatarStack } from '../components/badges';
import { CardSkeleton, EmptyState } from '../components/feedback';
import { inputClass } from '../components/ui';


export function Team() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.projects();
        if (!cancelled) setProjects(list);
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Could not load the team.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const people = new Map();
  for (const p of projects) {
    for (const m of p.members || []) {
      if (!people.has(m.user.id)) people.set(m.user.id, { ...m.user, projects: [] });
      people.get(m.user.id).projects.push(p.name);
    }
  }
  const q = query.trim().toLowerCase();
  const list = [...people.values()]
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Team</h1>
        <p className="mt-1 text-sm text-slate-500">{list.length} people across your projects.</p>
      </div>
      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teammates…" aria-label="Search teammates" className={`${inputClass} pl-9`} />
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (<CardSkeleton key={i} />))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="Nobody here yet" message="Invite teammates from any project page to grow this directory." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((u) => (
            <div key={u.id} className="rounded-2xl border bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold dark:text-white">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{u.projects.length} project{u.projects.length === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
