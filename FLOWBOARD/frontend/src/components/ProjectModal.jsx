import { useEffect, useState } from 'react';
import { Field, GhostButton, PrimaryButton, SecondaryButton, inputClass } from './ui';
import { Modal } from './Modal';
import { PROJECT_STATUS_LABEL, PROJECT_STATUSES, formatDateInput } from '../lib/format';
import { api } from '../lib/api';

export function ProjectModal({ open, initial, busy, serverError, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', status: 'PLANNING', startDate: '', dueDate: '' });
  const [errors, setErrors] = useState({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '',
        description: initial?.description || '',
        status: initial?.status || 'PLANNING',
        startDate: formatDateInput(initial?.startDate),
        dueDate: formatDateInput(initial?.dueDate),
      });
      setErrors({});
      setAiError('');
    }
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const generateDescription = async () => {
    if (!form.name.trim()) {
      setAiError('Enter a project name first');
      return;
    }
    setAiBusy(true);
    setAiError('');
    try {
      const res = await api.generateProjectDescription({
        name: form.name.trim(),
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
    if (form.name.trim().length < 3) errs.name = 'Project name must be at least 3 characters.';
    if (form.description.trim().length > 2000) errs.description = 'Description is too long.';
    if (form.startDate && form.dueDate && new Date(form.dueDate) < new Date(form.startDate)) {
      errs.dueDate = 'Due date cannot be before the start date.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit project' : 'Create project'}
      subtitle={initial ? 'Update the project details.' : 'Start something new — invite the team next.'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {serverError}
          </p>
        )}
        <Field label="Project name" error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Website relaunch" maxLength={100} autoFocus />
        </Field>
        <Field label="Description" error={errors.description}>
          <div className="flex flex-col gap-1.5">
            <textarea className={`${inputClass} min-h-[96px] resize-y`} value={form.description} onChange={set('description')} placeholder="What are we building, and why does it matter?" maxLength={2000} />
            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={generateDescription} disabled={aiBusy || !form.name.trim()} className="text-sm h-8 px-3">
                {aiBusy ? 'Generating…' : '✨ AI Assist'}
              </SecondaryButton>
              {aiError && <span className="text-sm text-rose-600 dark:text-rose-400">{aiError}</span>}
            </div>
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={set('status')}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            <input type="date" className={inputClass} value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        <div className="mt-1 flex justify-end gap-3">
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create project'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}