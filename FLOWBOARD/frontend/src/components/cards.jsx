import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, MessageSquare } from 'lucide-react';
import { Avatar, AvatarStack, ProjectStatusBadge, ProgressBar } from './badges';
import { dueLabel, formatDate } from '../lib/format';

export function ProjectCard({ project }) {
  const stats = project.stats || { total: 0, progress: 0, byStatus: {}, pending: 0, done: 0 };
  const members = (project.members || []).map((m) => m.user).filter(Boolean);
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.16 }}>
      <Link
        to={`/app/projects/${project.id}`}
        className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-pop dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-900"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
            {project.name}
          </h3>
          <ProjectStatusBadge value={project.status} />
        </div>
        <p className="clamp-2 mt-1.5 min-h-[2.5rem] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {project.description || 'No description yet.'}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">
              {stats.done}/{stats.total} tasks done
            </span>
            <span className="text-brand-600 dark:text-brand-300">{stats.progress}%</span>
          </div>
          <ProgressBar value={stats.progress} className="mt-1.5" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <AvatarStack users={members} />
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1" title="Due date">
              <CalendarDays size={14} /> {project.dueDate ? formatDate(project.dueDate) : dueLabel({})}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-300">
              Open <ArrowRight size={14} />
            </span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const PRIORITY_DOT = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-rose-500',
};

export function TaskCard({ task, onOpen, draggable, onDragStart, onDragEnd, compact }) {
  const commentCount = task._count?.comments ?? task.comments?.length ?? 0;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open task ${task.title}`}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus:outline-none focus:ring-2 focus:ring-brand-300 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-800"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.MEDIUM}`}
          title={`${task.priority} priority`}
        />
        <h4 className="flex-1 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {task.title}
        </h4>
      </div>
      {!compact && task.description && (
        <p className="clamp-2 mt-1.5 pl-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between pl-4">
        <span className="flex items-center gap-2">
          {task.assignee ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={task.assignee.name} size={22} />
              <span className="max-w-[90px] truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {task.assignee.name.split(' ')[0]}
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Unassigned</span>
          )}
        </span>
        <span className="flex items-center gap-2.5 text-[11px] text-slate-400">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1" title={formatDate(task.dueDate)}>
              <CalendarDays size={12} /> {formatDate(task.dueDate).replace(/, \d{4}$/, '')}
            </span>
          )}
          <span className="inline-flex items-center gap-1" title={`${commentCount} comments`}>
            <MessageSquare size={12} /> {commentCount}
          </span>
        </span>
      </div>
    </div>
  );
}
