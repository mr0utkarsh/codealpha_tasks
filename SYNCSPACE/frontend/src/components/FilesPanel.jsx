import { useRef, useState } from "react";
import { Download, FileText, Upload } from "lucide-react";
import api, { API_BASE } from "../lib/api.js";
export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
export default function FilesPanel({ roomCode, files, setFiles, notify, onShared }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true); setProgress(0);
    try {
      const data = await api.uploadFile(roomCode, file, setProgress);
      setFiles((prev) => [data.file, ...prev]);
      onShared?.(data.file);
      notify?.("File shared with the room.", "success");
    } catch (err) { notify?.(err.message, "error"); }
    finally { setUploading(false); setProgress(0); }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold">Shared files</div>
        <button onClick={() => inputRef.current?.click()} className="btn-ghost !px-3 !py-1.5 !text-xs"><Upload size={14} /> Share</button>
      </div>
      <input ref={inputRef} type="file" className="hidden" onChange={pick} />
      {uploading && <div className="px-4 pt-3"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: progress + "%" }} /></div><div className="mt-1 text-xs text-slate-400">Uploading... {progress}%</div></div>}
      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
        {files.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">No files shared yet.</div>}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200"><FileText size={17} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium" title={f.fileName}>{f.fileName}</div>
              <div className="text-xs text-slate-400">{formatSize(f.fileSize)} - {f.user?.name || "Member"}</div>
            </div>
            <a href={API_BASE + f.fileUrl} target="_blank" rel="noreferrer" aria-label={"Download " + f.fileName} className="btn-ghost !px-2.5 !py-1.5"><Download size={14} /></a>
          </div>
        ))}
      </div>
    </div>
  );
}
