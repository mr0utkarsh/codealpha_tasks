import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { cn } from '../../lib/format.js';

/**
 * Compact light/dark switch. Cycles through light → dark (the OS preference is
 * used until the visitor makes an explicit choice).
 */
export function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative grid size-10 place-items-center rounded-full text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white',
        className
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <Sun
        className={cn(
          'absolute size-[1.15rem] transition-all duration-300',
          isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          'absolute size-[1.15rem] transition-all duration-300',
          isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
        )}
        aria-hidden="true"
      />
      <Monitor className="sr-only" aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
