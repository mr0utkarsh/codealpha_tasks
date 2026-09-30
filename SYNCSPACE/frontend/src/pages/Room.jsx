import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Files, MessageSquare, Mic, MicOff, MonitorUp, MonitorOff, Palette, PhoneOff, Users, Video, VideoOff } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useRoom from "../webrtc/useRoom.js";
import VideoTile from "../components/VideoTile.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import ParticipantsPanel from "../components/ParticipantsPanel.jsx";
import FilesPanel from "../components/FilesPanel.jsx";
import Whiteboard from "../components/Whiteboard.jsx";
const TABS = [{ id: "chat", label: "Chat", icon: MessageSquare }, { id: "people", label: "People", icon: Users }, { id: "files", label: "Files", icon: Files }, { id: "board", label: "Board", icon: Palette }];
export function statusStyle(status) {
  if (status === "connected") return "bg-emerald-400/15 text-emerald-200 border-emerald-300/30";
  if (status === "reconnecting") return "bg-amber-400/15 text-amber-200 border-amber-300/30";
  if (status === "connecting") return "bg-sky-400/15 text-sky-200 border-sky-300/30";
  return "bg-rose-400/15 text-rose-200 border-rose-300/30";
}
export default function Room() {
  const { roomCode = "" } = useParams();
  const code = roomCode.toUpperCase();
  const { user } = useAuth();
  const { error, success } = useToast();
  const nav = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [tab, setTab] = useState("chat");
  const [mobilePanel, setMobilePanel] = useState(false);
  const r = useRoom(code, user);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await api.joinRoom(code);
        const [roomData, msgData, fileData] = await Promise.all([api.getRoom(code), api.messages(code), api.files(code)]);
        if (alive) { setRoom(roomData.room); setMessages(msgData.messages || []); setFiles(fileData.files || []); }
      } catch (err) { if (alive) { error(err.message); nav("/"); } }
    })();
    return () => { alive = false; };
  }, [code]);
  const socket = r.socket?.current;
  useEffect(() => {
    const s = r.socket?.current;
    if (!s) return;
    const onChat = (m) => setMessages((prev) => [...prev, m]);
    const onFile = ({ file }) => setFiles((prev) => (prev.some((f) => f.id === file.id) ? prev : [file, ...prev]));
    const onJoined = (p) => success(p.name + " joined.");
    const onLeft = (p) => error((p.name || "A participant") + " left.");
    s.on("chat:message", onChat);
    s.on("file:shared", onFile);
    s.on("participant:joined", onJoined);
    s.on("participant:left", onLeft);
    return () => { s.off("chat:message", onChat); s.off("file:shared", onFile); s.off("participant:joined", onJoined); s.off("participant:left", onLeft); };
  });
  const sendChat = useCallback((content) => { r.socket?.current?.emit("chat:message", { roomCode: code, content }); }, [code, r.socket]);
  const shareToggled = useCallback(async () => {
    if (r.sharing) { await r.stopShare(); return; }
    try {
      const ok = await r.startShare();
      if (ok === false) error("Screen-share permission was denied.");
    } catch { error("Could not start screen sharing."); }
  }, [r, error]);
  const onSharedFile = useCallback((file) => { r.socket?.current?.emit("file:shared", { roomCode: code, file }); }, [code, r.socket]);
  const leave = useCallback(async () => {
    try { r.leave(); await api.leaveRoom(code); } catch {}
    nav("/");
  }, [code, nav, r]);
  // Keyboard shortcuts advertised in the control tooltips (M / C / S / L).
  // Ignored while typing in a field so the chat box stays usable.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "m") { e.preventDefault(); r.toggleMic(); }
      else if (k === "c") { e.preventDefault(); r.toggleCam(); }
      else if (k === "s") { e.preventDefault(); shareToggled(); }
      else if (k === "l") { e.preventDefault(); leave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tiles = [{ id: "local", name: (user?.name || "You"), stream: r.localStream, muted: true, videoOff: !r.camOn, isLocal: true }];
  r.participants.forEach((p) => tiles.push({ id: p.socketId, name: p.name, stream: r.remoteStreams[p.socketId] || null, muted: false, videoOff: p.video === false, screening: p.screening, speaking: !!r.speaking[p.socketId] }));
  const gridClass = tiles.length === 1 ? "grid-cols-1" : tiles.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  const panelRef = useRef(null);
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
        <Link to="/" aria-label="Back to dashboard" className="btn-ghost !px-2.5 !py-2"><ArrowLeft size={16} /></Link>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold sm:text-base">{room?.name || "Loading room..."}</div>
          <div className="text-xs text-slate-400">Room {code}</div>
        </div>
        <div className={"ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold " + statusStyle(r.socketStatus)}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {r.socketStatus === "connected" ? "Connected" : r.socketStatus === "reconnecting" ? "Reconnecting..." : r.socketStatus === "connecting" ? "Connecting..." : "Disconnected"}
        </div>
        <button onClick={() => setMobilePanel(true)} className="btn-ghost !px-3 !py-2 lg:hidden">Panel</button>
      </header>
      {r.mediaError && <div className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">{r.mediaError}</div>}
      <div className="flex min-h-0 flex-1">
        <div className="scroll-thin flex min-w-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5">
          <div className={"grid flex-1 content-start gap-3 " + gridClass}>
            {tiles.map((t) => <VideoTile key={t.id} stream={t.stream} name={t.name} muted={t.muted} videoOff={t.videoOff} screening={t.screening} isLocal={t.isLocal} speaking={t.speaking} />)}
          </div>
          {!r.localStream && !r.mediaError && <div className="panel mt-3 p-4 text-sm text-slate-300">Requesting camera and microphone...</div>}
          <div className="sticky bottom-3 z-20 mt-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur">
              <button onClick={r.toggleMic} aria-label={r.micOn ? "Mute microphone" : "Unmute microphone"} title={r.micOn ? "Mute microphone (M)" : "Unmute microphone (M)"} className={"call-btn " + (r.micOn ? "" : "call-btn-off")}>{r.micOn ? <Mic size={19} /> : <MicOff size={19} />}</button>
              <button onClick={r.toggleCam} aria-label={r.camOn ? "Turn camera off" : "Turn camera on"} title="Toggle camera (C)" className={"call-btn " + (r.camOn ? "" : "call-btn-off")}>{r.camOn ? <Video size={19} /> : <VideoOff size={19} />}</button>
              <button onClick={shareToggled} aria-label={r.sharing ? "Stop sharing screen" : "Share screen"} title="Share screen (S)" className={"call-btn " + (r.sharing ? "call-btn-active" : "")}>{r.sharing ? <MonitorOff size={19} /> : <MonitorUp size={19} />}</button>
              <button onClick={() => { setTab("chat"); setMobilePanel(true); }} aria-label="Open chat" title="Chat" className="call-btn hidden sm:flex"><MessageSquare size={19} /></button>
              <button onClick={() => { setTab("files"); setMobilePanel(true); }} aria-label="Open files" title="Files" className="call-btn hidden sm:flex"><Files size={19} /></button>
              <button onClick={() => { setTab("board"); setMobilePanel(true); }} aria-label="Open whiteboard" title="Whiteboard" className="call-btn hidden sm:flex"><Palette size={19} /></button>
              <button onClick={leave} aria-label="Leave call" title="Leave call (L)" className="call-btn call-btn-danger"><PhoneOff size={19} /></button>
            </div>
          </div>
        </div>
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-white/10 bg-slate-950/60 lg:flex">
          <div className="flex gap-1 border-b border-white/10 p-2">
            {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold " + (tab === t.id ? "bg-cyan-400/15 text-cyan-100" : "text-slate-400 hover:bg-white/5")}>{<t.icon size={14} />}{t.label}</button>)}
          </div>
          <div className="min-h-0 flex-1">
            {tab === "chat" && <ChatPanel messages={messages} onSend={sendChat} meId={user?.id} />}
            {tab === "people" && <ParticipantsPanel participants={r.participants} meName={user?.name} />}
            {tab === "files" && <FilesPanel roomCode={code} files={files} setFiles={setFiles} notify={(m, k) => (k === "error" ? error(m) : success(m))} onShared={onSharedFile} />}
            {tab === "board" && <Whiteboard socketRef={r.socket} roomCode={code} />}
          </div>
        </aside>
      </div>
      {mobilePanel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobilePanel(false)} />
          <div ref={panelRef} className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-3xl border-t border-white/10 bg-slate-950">
            <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 p-2">
              {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold " + (tab === t.id ? "bg-cyan-400/15 text-cyan-100" : "text-slate-400")}>{<t.icon size={14} />}{t.label}</button>)}
              <button onClick={() => setMobilePanel(false)} className="btn-ghost !px-3 !py-2 text-xs">Close</button>
            </div>
            <div className="min-h-0 flex-1">
              {tab === "chat" && <ChatPanel messages={messages} onSend={sendChat} meId={user?.id} />}
              {tab === "people" && <ParticipantsPanel participants={r.participants} meName={user?.name} />}
              {tab === "files" && <FilesPanel roomCode={code} files={files} setFiles={setFiles} notify={(m, k) => (k === "error" ? error(m) : success(m))} onShared={onSharedFile} />}
              {tab === "board" && <Whiteboard socketRef={r.socket} roomCode={code} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
