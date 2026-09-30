import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TASK_STATUSES, TASK_STATUS_LABEL, formatDate } from '../lib/format';
import { AvatarStack, ProjectStatusBadge, ProgressBar } from '../components/badges';
import { ConfirmDialog, EmptyState } from '../components/feedback';
import { TaskCard } from '../components/cards';
import { MemberManager } from '../components/MemberManager';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';


const COLUMNS = [
  { key: 'TODO', hint: 'Ready to start' },
  { key: 'IN_PROGRESS', hint: 'Actively being worked on' },
  { key: 'IN_REVIEW', hint: 'Waiting for feedback' },
  { key: 'DONE', hint: 'Shipped' },
];

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState('');
  const [movingId, setMovingId] = useState('');
  const [taskModal, setTaskModal] = useState({ open: false, initial: null, preset: 'TODO' });
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const dragTask = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [proj, list, feed] = await Promise.all([
        api.project(id), api.tasks(id), api.projectActivity(id),
      ]);
      setProject(proj);
      setTasks(list);
      setActivity(feed);
    } catch (err) {
      toast.error(err.message || 'Could not load the project.');
      navigate('/app/projects', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
    for (const t of tasks) map[t.status]?.push(t);
    return map;
  }, [tasks]);

  const myRole = project?.members?.find((m) => m.user.id === user?.id)?.role;
  const canManage = project?.ownerId === user?.id || myRole === 'OWNER' || myRole === 'ADMIN';
  const isOwner = project?.ownerId === user?.id;
  const progress = project?.stats?.progress ?? 0;
  const memberUsers = (project?.members || []).map((m) => m.user);

  const refreshStats = async () => {
    try {
      const proj = await api.project(id);
      setProject(proj);
    } catch { /* stats are best-effort */ }
  };

  const moveTask = async (task, nextStatus) => {
    if (task.status === nextStatus) return;
    const prev = tasks;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    setMovingId(task.id);
    try {
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks((list) => list.map((t) => (t.id === task.id ? updated : t)));
      toast.success(`Moved to ${TASK_STATUS_LABEL[nextStatus]}.`);
      refreshStats();
    } catch (err) {
      setTasks(prev);
      toast.error(err.message || 'Could not move the task.');
    } finally {
      setMovingId('');
    }
  };

  const onDragStart = (e, task) => {
    dragTask.current = task;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', task.id); } catch { /* noop */ }
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    setDragOver('');
    const task = dragTask.current;
    dragTask.current = null;
    if (task) moveTask(task, status);
  };

  const openCreate = (status = 'TODO') => {
    setTaskError('');
    setTaskModal({ open: true, initial: null, preset: status });
  };

  const submitTask = async (payload) => {
    setTaskBusy(true);
    setTaskError('');
    try {
      if (taskModal.initial) {
        const updated = await api.updateTask(taskModal.initial.id, payload);
        setTasks((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        toast.success('Task updated.');
      } else {
        const created = await api.createTask(id, payload);
        setTasks((list) => [...list, created]);
        toast.success(`Task "${created.title}" created.`);
      }
      setTaskModal({ open: false, initial: null, preset: 'TODO' });
      refreshStats();
    } catch (err) {
      setTaskError(err.message || 'Could not save the task.');
    } finally {
      setTaskBusy(false);
    }
  };

  const submitEdit = async (payload) => {
    setEditBusy(true);
    setEditError('');
    try {
      const updated = await api.updateProject(id, payload);
      setProject(updated);
      setEditOpen(false);
      toast.success('Project updated.');
    } catch (err) {
      setEditError(err.message || 'Could not update the project.');
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.deleteProject(id);
      toast.success('Project deleted.');
      navigate('/app/projects');
    } catch (err) {
      toast.error(err.message || 'Could not delete the project.');
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading project…</p>;
  }

  if (!project) return null;

  const modalInitial = taskModal.initial
    ? taskModal.initial
    : taskModal.preset !== 'TODO' ? { status: taskModal.preset } : null;



  return (
    <div className="flex flex-col gap-5">
      <Link to="/app/projects" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500">
        <ArrowLeft size={15} /> All projects
      </Link>
      <section className="rounded-3xl border bg-white p-5 shadow-card sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl dark:text-white">{project.name}</h1>
              <ProjectStatusBadge value={project.status} />
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{project.description || 'No description yet.'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {canManage && (
              <button type="button" onClick={() => { setEditError(''); setEditOpen(true); }} aria-label="Edit project" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                <Pencil size={17} />
              </button>
            )}
            {isOwner && (
              <button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete project" className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">{project.stats?.done ?? 0}/{project.stats?.total ?? 0} tasks complete</span>
            <span className="text-brand-600">{progress}%</span>
          </div>
          <ProgressBar value={progress} className="mt-1.5" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
          <button type="button" onClick={() => setMembersOpen(true)} className="inline-flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-50">
            <AvatarStack users={memberUsers} />
            <span className="inline-flex items-center gap-1 font-semibold"><Users size={13} /> {memberUsers.length} members</span>
          </button>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Due {project.dueDate ? formatDate(project.dueDate) : '—'}</span>
        </div>
      </section>
      <section aria-label="Task board">
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver('')}
              onDrop={(e) => onDrop(e, col.key)}
              className="flex min-h-[280px] flex-col rounded-2xl border p-3"
            >
              <div className="flex items-center justify-between px-1 pb-2.5">
                <div>
                  <h2 className="text-[13px] font-extrabold uppercase tracking-wide dark:text-white">{TASK_STATUS_LABEL[col.key]}</h2>
                  <p className="text-[11px] text-slate-400">{col.hint} · {grouped[col.key].length}</p>
                </div>
                <button type="button" onClick={() => openCreate(col.key)} aria-label="Add task" className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                {grouped[col.key].map((task) => (
                  <div key={task.id} className={movingId === task.id ? 'opacity-50' : ''}>
                    <TaskCard task={task} draggable onDragStart={onDragStart} onDragEnd={() => setDragOver('')} onOpen={() => navigate(`/app/tasks/${task.id}`)} />
                  </div>
                ))}
                {grouped[col.key].length === 0 && (
                  <button type="button" onClick={() => openCreate(col.key)} className="rounded-2xl border border-dashed px-3 py-6 text-xs font-semibold text-slate-400">
                    Drop cards here, or click to add one
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <TaskModal
        open={taskModal.open}
        initial={modalInitial}
        members={project.members || []}
        projectId={id}
        busy={taskBusy}
        serverError={taskError}
        onClose={() => setTaskModal({ open: false, initial: null, preset: 'TODO' })}
        onSubmit={submitTask}
      />
      <ProjectModal open={editOpen} initial={project} busy={editBusy} serverError={editError} onClose={() => setEditOpen(false)} onSubmit={submitEdit} />
      <MemberManager open={membersOpen} project={project} canManage={canManage} onClose={() => setMembersOpen(false)} onChanged={(next) => setProject({ ...project, members: next })} />
      <ConfirmDialog open={deleteOpen} title="Delete this project?" message="All of its tasks and comments will be permanently removed." confirmLabel="Delete project" busy={deleteBusy} onCancel={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </div>
  );
}
