import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ open, title, subtitle, onClose, children, wide }) {
  const [visible, setVisible] = useState(open);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      return undefined;
    }
    closeTimer.current = setTimeout(() => setVisible(false), 180);
    return () => clearTimeout(closeTimer.current);
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-pop slim-scroll sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900 ${
              wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
            }`}
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
