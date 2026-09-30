import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, Clock, KanbanSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui';

const FEATURES = [
  { icon: KanbanSquare, title: 'Boards that stay readable', text: 'Four honest columns with drag-and-drop and priority signals at a glance.' },
  { icon: CheckCircle2, title: 'Context lives on the task', text: 'Comments, history and activity stay attached to the work itself.' },
  { icon: BarChart3, title: 'Progress you can trust', text: 'Dashboards computed from live data — always current, never staged.' },
  { icon: Clock, title: 'Dates that mean something', text: 'Start dates, due dates and overdue flags keep momentum visible.' },
];

export function Landing() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                Open workspace <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Log in</Link>
                <Link to="/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl dark:text-white">
              Plan. Collaborate. <span className="text-brand-600">Deliver.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-500 sm:text-lg dark:text-slate-400">
              FLOWBOARD gives every project a calm home: a readable board, clear owners, real deadlines and the conversation right next to the work.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={isAuthenticated ? '/app' : '/register'} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white sm:w-auto">
                {isAuthenticated ? 'Open your workspace' : 'Start free today'} <ArrowRight size={16} />
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-7 py-3.5 text-sm font-bold sm:w-auto dark:border-slate-700">
                  Log in
                </Link>
              )}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mx-auto mt-12 max-w-4xl rounded-3xl border p-5 text-left shadow-pop dark:border-slate-800">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { col: 'To Do', items: ['Write launch copy', 'Collect testimonials'] },
                { col: 'In Progress', items: ['Rebuild pricing page'] },
                { col: 'In Review', items: ['Accessibility audit'] },
                { col: 'Done', items: ['New navigation', 'Faster first paint'] },
              ].map((c) => (
                <div key={c.col} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-[11px] font-bold">{c.col}</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {c.items.map((t) => (
                      <div key={t} className="rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950">{t}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border p-6 shadow-card dark:border-slate-800">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950"><Icon size={20} /></span>
                <h3 className="mt-4 text-[15px] font-bold dark:text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <Logo size={30} />
          <p className="text-xs text-slate-400">© 2026 Flowboard · CodeAlpha Full Stack Internship — Task 3.</p>
        </div>
      </footer>
    </div>
  );
}
