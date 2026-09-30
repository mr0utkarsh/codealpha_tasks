import { useEffect, useState } from 'react';
import { Field, GhostButton, PrimaryButton, SecondaryButton, inputClass } from './ui';
import { Modal } from './Modal';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL, formatDateInput } from '../lib/format';
import { api } from '../lib/api';

export function TaskModal({ open, initial, members, projectId, busy, serverError, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '',
  });
  const [errors, setErrors] = useState({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title || '',
        description: initial?.description || '',
        status: initial?.status || 'TODO',
        priority: initial?.priority || 'MEDIUM',
        dueDate: formatDateInput(initial?.dueDate),
        assigneeId: initial?.assigneeId || initial?.assignee?.id || '',
      });
      setErrors({});
      setAiError('');
    }
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const generateDescription = async () => {
    if (!form.title.trim()) {
      setAiError('Enter a task title first');
      return;
    }
    setAiBusy(true);
    setAiError('');
    try {
      const res = await api.generateTaskDescription(projectId, {
        title: form.title.trim(),
        existingDescription: form.description.trim() || undefined,
      });
      setForm((f) => ({ ...f, description: res.description }));
    } catch (err) {
      setAiError(err.message || 'Failed to generate description');
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 3) errs.title = 'Task title must be at least 3 characters.';
    if (form.description.trim().length > 5000) errs.description = 'Description is too long.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assigneeId: form.assigneeId || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={initial ? 'Edit task' : 'Create task'}
      subtitle={initial ? 'Refine the details.' : 'Describe the work, then assign it to a teammate.'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {serverError}
          </p>
        )}
        <Field label="Title" error={errors.title}>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Design the onboarding flow" maxLength={150} autoFocus />
        </Field>
        <Field label="Description" error={errors.description}>
          <div className="flex flex-col gap-1.5">
            <textarea className={`${inputClass} min-h-[110px] resize-y`} value={form.description} onChange={set('description')} placeholder="Acceptance criteria, links, context…" maxLength={5000} />
            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={generateDescription} disabled={aiBusy || !form.title.trim()} className="text-sm h-8 px-3">
                {aiBusy ? 'Generating…' : '✨ AI Assist'}
              </SecondaryButton>
              {aiError && <span className="text-sm text-rose-600 dark:text-rose-400">{aiError}</span>}
            </div>
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={set('status')}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputClass} value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select className={inputClass} value={form.assigneeId} onChange={set('assigneeId')}>
              <option value="">Unassigned</option>
              {(members || []).map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} · {m.role}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputClass} value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        <div className="mt-1 flex justify-end gap-3">
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create task'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
