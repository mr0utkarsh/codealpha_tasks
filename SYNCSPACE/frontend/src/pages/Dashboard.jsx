import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Files, MessagesSquare, Plus, Radio, Trash2, Users, Video } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Layout from "../components/Layout.jsx";
export default function Dashboard() {
  const { user } = useAuth();
  const { error, success } = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { setData(await api.dashboard()); }
    catch (err) { error(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const d = await api.createRoom(name.trim());
      success("Room created: " + d.room.roomCode);
      nav("/room/" + d.room.roomCode);
    } catch (err) { error(err.message); }
    finally { setBusy(false); }
  };
  const join = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    try { await api.joinRoom(c); nav("/room/" + c); }
    catch (err) { error(err.message); }
    finally { setBusy(false); }
  };
  const remove = async (roomCode) => {
    if (!confirm("Delete room " + roomCode + "?")) return;
    try { await api.deleteRoom(roomCode); success("Room deleted."); load(); }
    catch (err) { error(err.message); }
  };
  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-400">Start a live session or rejoin a recent room.</p>
      </motion.div>
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="panel h-28 animate-pulse" />)}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="panel flex items-center gap-3 p-5"><Video className="text-cyan-300" /><div><div className="text-2xl font-bold">{data?.stats?.rooms ?? 0}</div><div className="text-xs text-slate-400">Rooms</div></div></div>
          <div className="panel flex items-center gap-3 p-5"><MessagesSquare className="text-cyan-300" /><div><div className="text-2xl font-bold">{data?.stats?.messages ?? 0}</div><div className="text-xs text-slate-400">Messages</div></div></div>
          <div className="panel flex items-center gap-3 p-5"><Files className="text-cyan-300" /><div><div className="text-2xl font-bold">{data?.stats?.files ?? 0}</div><div className="text-xs text-slate-400">Shared files</div></div></div>
        </div>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={create} className="panel p-5">
          <div className="flex items-center gap-2 font-semibold"><Plus size={17} className="text-cyan-300" /> Create room</div>
          <label className="label mt-4" htmlFor="room-name">Room name</label>
          <input id="room-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design sync" />
          <button className="btn-primary mt-4 w-full" disabled={busy || !name.trim()}>Create and join</button>
        </form>
        <form onSubmit={join} className="panel p-5">
          <div className="flex items-center gap-2 font-semibold"><Radio size={17} className="text-cyan-300" /> Join room</div>
          <label className="label mt-4" htmlFor="room-code">Room ID</label>
          <input id="room-code" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. ABCD-1234" />
          <button className="btn-ghost mt-4 w-full" disabled={busy || !code.trim()}>Join room</button>
        </form>
      </div>
      <h2 className="mt-8 flex items-center gap-2 font-semibold"><Users size={17} className="text-cyan-300" /> Recent rooms</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {(data?.rooms || []).map((r) => (
          <div key={r.id} className="panel flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <Link to={"/room/" + r.roomCode} className="truncate font-semibold hover:text-cyan-200">{r.name}</Link>
              <div className="text-xs text-slate-400">{r.roomCode} - {r._count.messages} messages - {r._count.files} files - {r._count.participants} members</div>
            </div>
            <Link to={"/room/" + r.roomCode} className="btn-primary !px-3.5 !py-2 !text-sm">Open</Link>
            <button onClick={() => remove(r.roomCode)} aria-label={"Delete " + r.name} title="Delete room" className="btn-ghost !px-3 !py-2"><Trash2 size={15} /></button>
          </div>
        ))}
        {!loading && (data?.rooms || []).length === 0 && <div className="panel p-6 text-sm text-slate-400">No rooms yet. Create your first room above.</div>}
      </div>
      <h2 className="mt-8 flex items-center gap-2 font-semibold"><Activity size={17} className="text-cyan-300" /> Recent activity</h2>
      <div className="panel mt-3 divide-y divide-white/5">
        {(data?.recentMessages || []).map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="font-semibold text-cyan-200">{m.user?.name}</span>
            <span className="min-w-0 flex-1 truncate text-slate-300">{m.content}</span>
            <Link to={"/room/" + m.room.roomCode} className="shrink-0 text-xs text-slate-400 hover:text-cyan-200">{m.room.name}</Link>
          </div>
        ))}
        {(data?.recentMessages || []).length === 0 && <div className="px-4 py-5 text-sm text-slate-500">No activity yet.</div>}
      </div>
    </Layout>
  );
}
