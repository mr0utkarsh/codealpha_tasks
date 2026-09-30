import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MonitorUp, PenLine, Radio, ShieldCheck, Video, MessagesSquare } from "lucide-react";
const features = [
  { icon: Video, title: "True WebRTC video", text: "Peer-to-peer camera and microphone streams with live connection states." },
  { icon: MonitorUp, title: "Screen sharing", text: "Share your screen with track replacement and graceful denial handling." },
  { icon: MessagesSquare, title: "Instant chat", text: "Socket.IO chat persisted to PostgreSQL with history on rejoin." },
  { icon: PenLine, title: "Shared whiteboard", text: "Canvas strokes synchronized live across every participant." },
  { icon: Radio, title: "Live presence", text: "Join/leave events, mic/camera states, and reconnect handling." },
  { icon: ShieldCheck, title: "Secure rooms", text: "JWT auth, membership checks, validated uploads, hashed passwords." },
];
export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950"><Video size={20} /></span>
          <div><div className="font-extrabold tracking-tight">SYNCSPACE</div><div className="text-xs text-slate-400">Connect. Collaborate. In real time.</div></div>
        </div>
        <div className="flex gap-2"><Link to="/login" className="btn-ghost">Log in</Link><Link to="/register" className="btn-primary">Get started</Link></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="panel mt-8 overflow-hidden p-8 md:p-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Real-time communication rooms</div>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">Meet, draw, chat, and share - live in one space.</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Create a room, invite collaborators with a short room code, and join real video with chat, files, and a synchronized whiteboard.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/register" className="btn-primary">Create your first room</Link><Link to="/login" className="btn-ghost">Join with a room code</Link></div>
        </motion.div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="panel p-5">
              <f.icon size={20} className="text-cyan-300" />
              <div className="mt-3 font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-slate-400">{f.text}</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
