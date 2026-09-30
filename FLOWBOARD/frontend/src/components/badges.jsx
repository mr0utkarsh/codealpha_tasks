import { PRIORITY_LABEL, TASK_STATUS_LABEL, avatarColor, initials } from '../lib/format';

const STATUS_STYLES = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  IN_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  PLANNING: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  ACTIVE: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  URGENT: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[value] || STATUS_STYLES.TODO}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {TASK_STATUS_LABEL[value] || value}
    </span>
  );
}

export function ProjectStatusBadge({ value }) {
  const labels = { PLANNING: 'Planning', ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[value] || STATUS_STYLES.PLANNING}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {labels[value] || value}
    </span>
  );
}

export function PriorityBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[value] || PRIORITY_STYLES.MEDIUM}`}
    >
      {PRIORITY_LABEL[value] || value}
    </span>
  );
}

export function Avatar({ name, size = 32, className = '' }) {
  const hue = avatarColor(name);
  return (
    <span
      title={name}
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white dark:ring-slate-900 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.34),
        background: `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${(hue + 28) % 360} 60% 42%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = 28 }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="inline-flex items-center" aria-label={`${users.length} members`}>
      {shown.map((u, i) => (
        <span key={u?.id || i} className={i > 0 ? '-ml-2' : ''}>
          <Avatar name={u?.name || u?.user?.name || '?'} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="-ml-2 inline-flex items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

export function ProgressBar({ value = 0, className = '' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <span
      className={`block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </span>
  );
}
