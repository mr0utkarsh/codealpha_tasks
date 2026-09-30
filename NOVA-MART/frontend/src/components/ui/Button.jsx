import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format.js';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-light dark:focus-visible:ring-offset-canvas-dark';

const VARIANTS = {
  primary:
    'bg-ink-950 text-white shadow-soft hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100',
  brand: 'bg-brand-600 text-white shadow-soft hover:bg-brand-700',
  secondary:
    'border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-600 dark:hover:bg-ink-800',
  ghost: 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800/70',
  subtle:
    'bg-ink-100 text-ink-900 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-50 dark:hover:bg-ink-700',
  danger: 'bg-rose-600 text-white shadow-soft hover:bg-rose-700',
  'danger-ghost':
    'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-[0.95rem]',
  xl: 'h-14 px-8 text-base',
  icon: 'size-11',
};

/**
 * @param {{ variant?: keyof typeof VARIANTS, size?: keyof typeof SIZES, fullWidth?: boolean, className?: string }} [options]
 */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth, className } = {}) {
  return cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, fullWidth && 'w-full', className);
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, isLoading = false, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

/** Same visual language, rendered as a router link. */
export const ButtonLink = forwardRef(function ButtonLink(
  { to, href, variant = 'primary', size = 'md', fullWidth = false, className, children, ...props },
  ref
) {
  const classes = buttonClasses({ variant, size, fullWidth, className });

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} to={to} className={classes} {...props}>
      {children}
    </Link>
  );
});

export default Button;
