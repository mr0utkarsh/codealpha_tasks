import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MessageSquare, Pencil, Send, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TASK_STATUSES, TASK_STATUS_LABEL, dueLabel, formatDate, formatRelative } from '../lib/format';
import { Avatar, PriorityBadge, StatusBadge } from '../components/badges';
import { ConfirmDialog, EmptyState } from '../components/feedback';
import { TaskModal } from '../components/TaskModal';

const COMMENT_INTENTS = [
  { value: 'update', label: 'Progress update' },
  { value: 'question', label: 'Ask a question' },
  { value: 'blocker', label: 'Report a blocker' },
  { value: 'handoff', label: 'Handoff note' },
];

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletingComment, setDeletingComment] = useState('');
  const [members, setMembers] = useState([]);
  const [aiCommentBusy, setAiCommentBusy] = useState(false);
  const [aiCommentError, setAiCommentError] = useState('');
  const [aiIntent, setAiIntent] = useState('update');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const full = await api.task(id);
      setTask(full);
      setComments(full.comments || []);
      try {
        setMembers(await api.members(full.project.id));
      } catch { setMembers([]); }
    } catch (err) {
      toast.error(err.message || 'Could not load the task.');
      navigate('/app/projects', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status) => {
    if (!task || task.status === status) return;
    const prev = task;
    setTask({ ...task, status });
    try {
      const updated = await api.updateTask(task.id, { status });
      setTask((t) => ({ ...t, ...updated }));
      toast.success(`Moved to ${TASK_STATUS_LABEL[status]}.`);
    } catch (err) {
      setTask(prev);
      toast.error(err.message || 'Could not change status.');
    }
  };

  const submitEdit = async (payload) => {
    setEditBusy(true);
    setEditError('');
    try {
      const updated = await api.updateTask(task.id, payload);
      setTask((t) => ({ ...t, ...updated }));
      setEditOpen(false);
      toast.success('Task updated.');
    } catch (err) {
      setEditError(err.message || 'Could not update the task.');
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    const projectId = task.project.id;
    try {
      await api.deleteTask(task.id);
      toast.success('Task deleted.');
      navigate(`/app/projects/${projectId}`);
    } catch (err) {
      toast.error(err.message || 'Could not delete the task.');
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setCommentBusy(true);
    try {
      const created = await api.addComment(task.id, { content });
      setComments((list) => [...list, created]);
      setDraft('');
      toast.success('Comment posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post the comment.');
    } finally {
      setCommentBusy(false);
    }
  };

  const deleteComment = async (comment) => {
    setDeletingComment(comment.id);
    try {
      await api.deleteComment(comment.id);
      setComments((list) => list.filter((c) => c.id !== comment.id));
      toast.success('Comment deleted.');
    } catch (err) {
      toast.error(err.message || 'Could not delete the comment.');
    } finally {
      setDeletingComment('');
    }
  };

  const assistComment = async (intent) => {
    if (!task) return;
    setAiCommentBusy(true);
    setAiCommentError('');
    try {
      const res = await api.assistComment(task.id, { intent, context: draft.trim() || undefined });
      setDraft(res.suggestion);
      setAiIntent(intent);
    } catch (err) {
      setAiCommentError(err.message || 'Failed to generate suggestion');
    } finally {
      setAiCommentBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading task…</p>;
  if (!task) return null;

  const activities = task.activities || [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link to={`/app/projects/${task.project.id}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500">
        <ArrowLeft size={15} /> {task.project.name}
      </Link>
      <article className="rounded-3xl border bg-white p-5 shadow-card sm:p-7 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={task.status} />
          <PriorityBadge value={task.priority} />
          <span className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={() => { setEditError(''); setEditOpen(true); }} aria-label="Edit task" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete task" className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 size={16} />
            </button>
          </span>
        </div>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl dark:text-white">{task.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{task.description || 'No description provided.'}</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Change task status">
          {TASK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeStatus(s)}
              disabled={task.status === s}
              className="rounded-xl border px-3 py-1.5 text-xs font-bold"
            >
              {TASK_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </article>
      <section className="rounded-3xl border bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400"><MessageSquare size={15} /> Comments ({comments.length})</h2>
        <form onSubmit={submitComment} className="mt-3 flex flex-col gap-2">
          <div className="relative">
            <select value={aiIntent} onChange={(e) => setAiIntent(e.target.value)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-xs text-slate-500 bg-transparent border-none focus:outline-none pointer-events-none" aria-hidden="true">
              {COMMENT_INTENTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            <div className="pr-36">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" maxLength={2000} className="w-full rounded-xl border px-3.5 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select value={aiIntent} onChange={(e) => setAiIntent(e.target.value)} className="rounded-lg border px-2.5 py-1.5 text-xs text-slate-600 bg-white" aria-label="AI assist intent">
                {COMMENT_INTENTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
              <button type="button" onClick={() => assistComment(aiIntent)} disabled={aiCommentBusy || !task} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                {aiCommentBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                AI Assist
              </button>
              {aiCommentError && <span className="text-xs text-rose-600">{aiCommentError}</span>}
            </div>
            <button type="submit" disabled={commentBusy || !draft.trim()} aria-label="Post comment" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {commentBusy ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
        <div className="mt-4 flex flex-col gap-3">
          {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.author?.name} size={32} />
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/70">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{c.author?.name}</p>
                  <p className="text-[11px] text-slate-400">{formatRelative(c.createdAt)}</p>
                  {(c.authorId === user?.id || c.author?.id === user?.id) && (
                    <button type="button" onClick={() => deleteComment(c)} aria-label="Delete comment" className="ml-auto rounded-lg p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <TaskModal open={editOpen} initial={task} members={members} projectId={task?.project?.id} busy={editBusy} serverError={editError} onClose={() => setEditOpen(false)} onSubmit={submitEdit} />
      <ConfirmDialog open={deleteOpen} title="Delete this task?" message="The task and its comments will be permanently removed." confirmLabel="Delete task" busy={deleteBusy} onCancel={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
      <p className="text-xs text-slate-400">History entries: {activities.length} · {dueLabel(task)}</p>
    </div>
  );
}

