import { Mic, MicOff, MonitorUp, Video, VideoOff } from "lucide-react";
import { initials } from "./VideoTile.jsx";
export default function ParticipantsPanel({ participants, meName }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">Participants ({participants.length + 1})</div>
      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 text-sm font-bold text-cyan-100">{initials(meName)}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{meName} (You)</div></div>
        </div>
        {participants.map((p) => (
          <div key={p.socketId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{initials(p.name)}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div></div>
            <span title={p.audio ? "Mic on" : "Mic muted"} className={p.audio ? "text-emerald-300" : "text-rose-300"}>{p.audio ? <Mic size={15} /> : <MicOff size={15} />}</span>
            <span title={p.video ? "Camera on" : "Camera off"} className={p.video ? "text-emerald-300" : "text-rose-300"}>{p.video ? <Video size={15} /> : <VideoOff size={15} />}</span>
            {p.screening && <span title="Sharing screen" className="text-cyan-300"><MonitorUp size={15} /></span>}
          </div>
        ))}
      </div>
    </div>
  );
}
