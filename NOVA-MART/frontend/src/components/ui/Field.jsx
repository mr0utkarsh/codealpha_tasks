import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/format.js';

const CONTROL_BASE =
  'w-full rounded-2xl border bg-white px-4 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-ink-50 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500 dark:disabled:bg-ink-900/60';

function controlClasses({ hasError, withIcon }) {
  return cn(
    CONTROL_BASE,
    'h-12',
    withIcon && 'pl-11',
    hasError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50'
      : 'border-ink-200 dark:border-ink-700'
  );
}

/**
 * Labelled text input with inline validation messaging.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className, containerClassName, id, required, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100"
        >
          {label}
          {required && <span className="ml-1 text-brand-600 dark:text-brand-400">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={controlClasses({ hasError: Boolean(error), withIcon: Boolean(Icon) })}
          {...props}
        />
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          <AlertCircle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, containerClassName, id, rows = 4, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          CONTROL_BASE,
          'py-3 leading-relaxed',
          error
            ? 'border-rose-300 focus:border-rose-500 dark:border-rose-500/50'
            : 'border-ink-200 dark:border-ink-700',
          className
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, containerClassName, id, children, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          controlClasses({ hasError: Boolean(error) }),
          'cursor-pointer appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236e6e7c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{hint}</p>
      )}
    </div>
  );
});

export default Input;
