import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
export function Login() {
  const { login } = useAuth();
  const { error, success } = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(form.email.trim(), form.password); success("Welcome back!"); nav("/"); }
    catch (err) { error(err.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="panel w-full max-w-md p-7">
        <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950"><Video size={20} /></span><div className="font-extrabold">SYNCSPACE</div></div>
        <h1 className="mt-5 text-2xl font-bold">Log in</h1>
        <p className="text-sm text-slate-400">Connect. Collaborate. In real time.</p>
        <label className="label mt-5" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="label mt-4" htmlFor="password">Password</label>
        <input id="password" className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
        <div className="mt-4 text-center text-sm text-slate-400">No account? <Link to="/register" className="text-cyan-300">Create one</Link></div>
      </motion.form>
    </div>
  );
}
export function Register() {
  const { register } = useAuth();
  const { error, success } = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { error("Passwords do not match."); return; }
    setBusy(true);
    try { await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, confirmPassword: form.confirmPassword }); success("Account created. Welcome!"); nav("/"); }
    catch (err) { error(err.message); }
    finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="panel w-full max-w-md p-7">
        <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950"><Video size={20} /></span><div className="font-extrabold">SYNCSPACE</div></div>
        <h1 className="mt-5 text-2xl font-bold">Create account</h1>
        <label className="label mt-5" htmlFor="name">Name</label>
        <input id="name" className="input" required minLength={2} value={form.name} onChange={set("name")} />
        <label className="label mt-4" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" required value={form.email} onChange={set("email")} />
        <label className="label mt-4" htmlFor="password">Password</label>
        <input id="password" className="input" type="password" required minLength={8} value={form.password} onChange={set("password")} />
        <label className="label mt-4" htmlFor="confirm">Confirm password</label>
        <input id="confirm" className="input" type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} />
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        <div className="mt-4 text-center text-sm text-slate-400">Have an account? <Link to="/login" className="text-cyan-300">Log in</Link></div>
      </motion.form>
    </div>
  );
}
