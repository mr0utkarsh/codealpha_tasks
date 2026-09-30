import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, FolderKanban, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ProjectCard } from '../components/cards';
import { CardSkeleton, EmptyState } from '../components/feedback';
import { ProjectModal } from '../components/ProjectModal';
import { GhostButton, inputClass } from '../components/ui';


export function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('recent');
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.projects({ q: query.trim(), status, sort });
      setProjects(list);
    } catch (err) {
      toast.error(err.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [query, status, sort, toast]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const handleCreate = async (payload) => {
    setBusy(true);
    setServerError('');
    try {
      const created = await api.createProject(payload);
      setProjects((list) => [created, ...list]);
      setModalOpen(false);
      toast.success(`Project "${created.name}" created.`);
    } catch (err) {
      setServerError(err.message || 'Could not create the project.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">{projects.length} project{projects.length === 1 ? '' : 's'} in your workspace.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={16} /> New project
        </button>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-3 shadow-card sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" aria-label="Search projects" className={`${inputClass} pl-9`} />
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className={inputClass}>
            <option value="ALL">All statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects" className={inputClass}>
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="due">Due date</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (<CardSkeleton key={i} />))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={query || status !== 'ALL' ? 'No matching projects' : 'No projects yet'}
          message={query || status !== 'ALL' ? 'Try a different search or filter.' : 'Create your first project and invite the team.'}
          action={<GhostButton onClick={() => { setQuery(''); setStatus('ALL'); }}><ArrowUpDown size={15} /> Clear filters</GhostButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (<ProjectCard key={p.id} project={p} />))}
        </div>
      )}
      <ProjectModal open={modalOpen} busy={busy} serverError={serverError} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
