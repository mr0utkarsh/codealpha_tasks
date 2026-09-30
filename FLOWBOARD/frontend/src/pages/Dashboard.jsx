import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, FolderKanban, Inbox } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, ProgressBar } from '../components/badges';
import { CardSkeleton, EmptyState } from '../components/feedback';
import { ProjectCard } from '../components/cards';
import { formatRelative } from '../lib/format';

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dash, projs] = await Promise.all([api.dashboard(), api.projects()]);
        if (!cancelled) {
          setData(dash);
          setProjects(projs.slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load the dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border p-5 dark:border-slate-800"><CardSkeleton /></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon={Inbox} title="Dashboard unavailable" message={error} action={
        <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Retry</button>
      } />
    );
  }

  const stats = data?.stats || {};
  const activity = data?.recentActivity || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Good to see you, {user?.name?.split(' ')[0]}.</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is what is happening across your projects today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total projects" value={stats.totalProjects ?? 0} />
        <StatCard label="Active projects" value={stats.activeProjects ?? 0} />
        <StatCard label="Completed" value={stats.completedProjects ?? 0} />
        <StatCard label="Pending tasks" value={stats.pendingTasks ?? 0} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border p-5 shadow-card xl:col-span-2 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Overall completion</h2>
            <span className="text-sm font-extrabold text-brand-600">{stats.progress ?? 0}%</span>
          </div>
          <ProgressBar value={stats.progress ?? 0} className="mt-3 h-2.5" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <MiniStat value={stats.totalTasks ?? 0} label="Total tasks" />
            <MiniStat value={stats.assignedToMe ?? 0} label="Assigned to me" />
            <MiniStat value={stats.myPending ?? 0} label="My pending" />
          </div>
        </div>
        <div className="rounded-2xl border p-5 shadow-card dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400"><Activity size={15} /> Recent activity</h2>
          <div className="mt-3 flex max-h-64 flex-col gap-3 overflow-y-auto slim-scroll">
            {activity.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 text-sm">
                <Avatar name={a.user?.name || 'System'} size={26} />
                <div className="min-w-0">
                  <p className="leading-snug"><span className="font-semibold">{a.user?.name || 'Someone'}</span> <span className="text-slate-500">{shorten(a.description)}</span></p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{a.project?.name} · {formatRelative(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold dark:text-white">Recent projects</h2>
          <Link to="/app/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">View all <ArrowRight size={15} /></Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" message="Create your first project to get the board moving." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (<ProjectCard key={p.id} project={p} />))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border p-5 shadow-card dark:border-slate-800">
      <p className="text-2xl font-extrabold tracking-tight dark:text-white">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-lg font-extrabold dark:text-white">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function shorten(text = '') {
  return text.replace(/^[A-Za-z ]+?(created|moved|updated|deleted|commented|added|removed)/, '$1');
}
