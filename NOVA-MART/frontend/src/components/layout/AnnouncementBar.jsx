import { Truck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

const MESSAGES = [
  { icon: Truck, label: 'Free express shipping on orders over $150' },
  { icon: RotateCcw, label: '30-day free returns, no questions asked' },
  { icon: ShieldCheck, label: 'Secure checkout & 2-year warranty' },
  { icon: Sparkles, label: 'New season drop - up to 30% off selected pieces' },
];

/**
 * Slim promotional strip above the header. On small screens the messages cycle
 * through a gentle marquee so nothing is lost.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-ink-950 text-white dark:border-b dark:border-ink-800 dark:bg-black">
      <div className="container flex h-10 items-center justify-between gap-6">
        <div className="hidden items-center gap-6 lg:flex">
          {MESSAGES.slice(0, 3).map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-xs text-ink-200">
              <Icon className="size-3.5 text-brand-400" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <p className="flex flex-1 items-center justify-center gap-2 text-xs text-ink-200 lg:flex-none">
          <Sparkles className="size-3.5 text-brand-400" aria-hidden="true" />
          {MESSAGES[3].label}
        </p>

        <span className="hidden text-xs text-ink-300 lg:inline">USD $</span>
      </div>
    </div>
  );
}

export default AnnouncementBar;
