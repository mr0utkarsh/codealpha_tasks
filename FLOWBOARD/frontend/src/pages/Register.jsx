import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, PrimaryButton, inputClass } from '../components/ui';
import { AuthShell } from './Login';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    setServerError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/app', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AuthShell title="Create your workspace" subtitle="Free to start. Your first project is minutes away.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{serverError}</p>}
        <Field label="Full name" error={errors.name}>
          <input autoComplete="name" className={inputClass} value={form.name} onChange={set('name')} placeholder="Aarav Sharma" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="you@team.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password}>
            <input type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={set('password')} placeholder="8+ characters" />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <input type="password" autoComplete="new-password" className={inputClass} value={form.confirm} onChange={set('confirm')} placeholder="Repeat it" />
          </Field>
        </div>
        <PrimaryButton type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</PrimaryButton>
        <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
