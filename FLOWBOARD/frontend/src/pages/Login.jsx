import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, Logo, PrimaryButton, inputClass } from '../components/ui';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    setServerError('');
    try {
      await login(form.email.trim(), form.password);
      navigate('/app', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Could not log in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to pick up where you left off.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{serverError}</p>}
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@team.com" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" autoComplete="current-password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</PrimaryButton>
        <p className="text-center text-sm text-slate-500">New to Flowboard? <Link to="/register" className="font-semibold text-brand-600">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex w-full flex-col justify-center px-4 py-10 sm:mx-auto sm:max-w-md">
        <button type="button" onClick={() => navigate('/')} aria-label="Back to home" className="mb-8 self-start"><Logo /></button>
        <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="rounded-3xl border bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">{children}</div>
      </div>
    </div>
  );
}
