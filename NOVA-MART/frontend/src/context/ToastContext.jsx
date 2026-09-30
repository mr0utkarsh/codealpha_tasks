import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/format.js';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200/80 bg-white dark:border-emerald-500/30 dark:bg-ink-900',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: AlertTriangle,
    wrapper: 'border-rose-200/80 bg-white dark:border-rose-500/30 dark:bg-ink-900',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  info: {
    icon: Info,
    wrapper: 'border-ink-200/80 bg-white dark:border-ink-700/60 dark:bg-ink-900',
    iconClass: 'text-brand-600 dark:text-brand-300',
  },
};

const DEFAULT_DURATION = 4000;

/**
 * Lightweight toast system - no external dependency, keyboard friendly and
 * announced to screen readers via `role="status"`.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { variant = 'info', title, duration = DEFAULT_DURATION } = {}) => {
      if (!message) return null;

      counter.current += 1;
      const id = counter.current;

      setToasts((current) => [...current.slice(-3), { id, message, variant, title }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      error: (message, options) => push(message, { ...options, variant: 'error' }),
      info: (message, options) => push(message, { ...options, variant: 'info' }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const variant = VARIANTS[toast.variant] ?? VARIANTS.info;
          const Icon = variant.icon;

          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift animate-slide-up',
                variant.wrapper
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', variant.iconClass)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="font-display text-sm font-semibold text-ink-950 dark:text-white">
                    {toast.title}
                  </p>
                )}
                <p className="text-sm leading-snug text-ink-700 dark:text-ink-200">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 rounded-full p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>.');
  return context;
}

export default ToastContext;
