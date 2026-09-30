import { useEffect, useState } from 'react';
import { Search, UserMinus, UserPlus, X } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from './badges';
import { Modal } from './Modal';
import { useToast } from '../context/ToastContext';
import { inputClass } from './ui';

export function MemberManager({ open, project, canManage, onClose, onChanged }) {
  const toast = useToast();
  const [members, setMembers] = useState(project?.members || []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (open) {
      setMembers(project?.members || []);
      setQuery('');
      setResults([]);
    }
  }, [open, project]);

  useEffect(() => {
    if (!open || !canManage) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await api.searchUsers(q);
        const memberIds = new Set(members.map((m) => m.user.id));
        setResults(users.filter((u) => !memberIds.has(u.id)).slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, canManage, members]);

  const addMember = async (user) => {
    setBusyId(user.id);
    try {
      const added = await api.addMember(project.id, { userId: user.id });
      const next = [...members, added];
      setMembers(next);
      setResults((r) => r.filter((u) => u.id !== user.id));
      setQuery('');
      toast.success(`${user.name} joined the project.`);
      onChanged?.(next);
    } catch (err) {
      toast.error(err.message || 'Could not add member.');
    } finally {
      setBusyId('');
    }
  };

  const removeMember = async (member) => {
    if (member.role === 'OWNER') {
      toast.error('The project owner cannot be removed.');
      return;
    }
    setBusyId(member.user.id);
    try {
      await api.removeMember(project.id, member.user.id);
      const next = members.filter((m) => m.user.id !== member.user.id);
      setMembers(next);
      toast.success(`${member.user.name} was removed.`);
      onChanged?.(next);
    } catch (err) {
      toast.error(err.message || 'Could not remove member.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Project members" subtitle={`${members.length} people on this project.`}>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.user.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <Avatar name={m.user.name} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{m.user.name}</p>
              <p className="truncate text-xs text-slate-500">{m.user.email}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              {m.role}
            </span>
            {canManage && m.role !== 'OWNER' && (
              <button
                type="button"
                onClick={() => removeMember(m)}
                disabled={busyId === m.user.id}
                aria-label={`Remove ${m.user.name}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950"
              >
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      {canManage && (
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Invite teammates</p>
          <div className="relative mt-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-9 pr-9`}
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search users to invite"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {searching && <p className="px-1 py-2 text-xs text-slate-400">Searching…</p>}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-1 py-2 text-xs text-slate-400">No matching people found.</p>
            )}
            {results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <Avatar name={u.name} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addMember(u)}
                  disabled={busyId === u.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <UserPlus size={14} /> {busyId === u.id ? 'Adding…' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
