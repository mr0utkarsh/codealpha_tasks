import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles, FileText, Loader2, RotateCcw, MessageCircleMore } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
  { value: 'polite', label: 'Polite' },
  { value: 'assertive', label: 'Assertive' },
];

export default function ChatPanel({ messages, onSend, meId, roomCode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewriteTone, setRewriteTone] = useState('professional');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = () => { const v = draft.trim(); if (!v) return; onSend(v); setDraft(""); };

  const handleSummarize = async () => {
    if (!roomCode) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await api.summarizeChat(roomCode);
      toast.info(res.summary || "No summary available.");
    } catch (err) {
      setAiError(err.message || "Failed to summarize chat");
      toast.error(err.message || "Failed to summarize chat");
    } finally {
      setAiBusy(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectedMessage) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await api.rewriteMessage(selectedMessage.content, rewriteTone);
      if (selectedMessage.user?.id === meId || selectedMessage.userId === meId) {
        setDraft(res.rewritten);
        setShowRewrite(false);
        setSelectedMessage(null);
      } else {
        toast.info("Rewritten (copy to use): " + res.rewritten);
      }
    } catch (err) {
      setAiError(err.message || "Failed to rewrite message");
      toast.error(err.message || "Failed to rewrite message");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSuggestReplies = async () => {
    if (!roomCode) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await api.suggestReplies(roomCode);
      setSuggestions(res.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      setAiError(err.message || "Failed to get suggestions");
      toast.error(err.message || "Failed to get suggestions");
    } finally {
      setAiBusy(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setDraft(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const openRewrite = (message) => {
    setSelectedMessage(message);
    setShowRewrite(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={16} className="text-cyan-300" /> Room chat
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleSummarize} disabled={aiBusy || messages.length === 0} title="Summarize chat" className="input h-8 w-8 p-0 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-50" aria-label="Summarize chat">
            {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          </button>
          <button onClick={handleSuggestReplies} disabled={aiBusy || messages.length === 0} title="Suggest replies" className="input h-8 w-8 p-0 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-50" aria-label="Suggest replies">
            {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">No messages yet.<br />Say hello to start the conversation.</div>
        )}
        {messages.map((m) => {
          const mine = (m.user?.id || m.userId) === meId;
          return (
            <div key={m.id || (m.createdAt + m.content)} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm relative " + (mine ? "rounded-br-md bg-cyan-400 text-slate-950" : "rounded-bl-md border border-white/10 bg-white/5 text-slate-100")}>
                {!mine && <div className="mb-0.5 text-xs font-semibold text-cyan-200">{m.user?.name || "Member"}</div>}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className={"mt-1 text-[11px] flex items-center gap-1.5 " + (mine ? "text-slate-800" : "text-slate-400")}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  <button onClick={() => openRewrite(m)} className="ml-auto p-0.5 hover:text-cyan-300 transition-colors" aria-label="Rewrite with AI" title="Rewrite with AI">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex flex-col gap-2 border-t border-white/10 p-3">
        {showSuggestions && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => useSuggestion(s)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/10 transition-colors" title="Use this suggestion">
                {s}
              </button>
            ))}
            <button onClick={() => setShowSuggestions(false)} className="rounded-xl border border-white/10 bg-transparent px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Dismiss</button>
          </div>
        )}
        {showRewrite && selectedMessage && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 px-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-cyan-200">Rewrite as:</span>
              <select value={rewriteTone} onChange={(e) => setRewriteTone(e.target.value)} className="input flex-1 text-xs py-1" aria-label="Rewrite tone">
                {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button onClick={() => { setShowRewrite(false); setSelectedMessage(null); }} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRewrite} disabled={aiBusy} className="btn-primary flex-1">
                {aiBusy ? <Loader2 size={14} className="animate-spin" /> : "Rewrite"}
              </button>
              <button onClick={() => { setShowRewrite(false); setSelectedMessage(null); }} className="input flex-1 text-slate-300 hover:text-white">Cancel</button>
            </div>
            {aiError && <div className="mt-1 text-xs text-rose-400">{aiError}</div>}
          </div>
        )}
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Message the room..." aria-label="Message the room" className="input flex-1" />
          <button onClick={send} aria-label="Send message" className="btn-primary !px-3.5"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}