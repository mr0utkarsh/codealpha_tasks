import { useEffect, useRef } from "react";
import { MicOff, MonitorUp } from "lucide-react";
export function initials(name) { return String(name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
export default function VideoTile({ stream, name, muted, videoOff, screening, isLocal, speaking }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return (
    <div className={"relative overflow-hidden rounded-2xl border bg-slate-900 " + (speaking ? "border-cyan-300/70" : "border-white/10")}>
      {stream && !videoOff ? (
        <video ref={ref} autoPlay playsInline muted={!!muted} className="aspect-video h-full w-full bg-black object-cover" />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/15 text-2xl font-bold text-cyan-200">{initials(name)}</div>
        </div>
      )}
      <div className="absolute left-2 top-2 flex gap-1.5">
        {screening && <span className="flex items-center gap-1 rounded-full bg-cyan-400 px-2 py-0.5 text-[11px] font-semibold text-slate-950"><MonitorUp size={12} /> Screen</span>}
        {isLocal && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white backdrop-blur">You</span>}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="max-w-[70%] truncate rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur">{name}</span>
        {videoOff && <span className="rounded-full bg-black/55 px-2 py-1 text-white backdrop-blur"><MicOff size={12} /></span>}
      </div>
    </div>
  );
}
