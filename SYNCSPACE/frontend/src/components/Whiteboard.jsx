import { useEffect, useRef, useState } from "react";
import { Brush, Eraser, Trash2 } from "lucide-react";
const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#ffffff"];
export default function Whiteboard({ socketRef, roomCode }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(3);
  const [erase, setErase] = useState(false);
  const drawing = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const img = canvas.toDataURL();
      canvas.width = Math.max(300, rect.width * devicePixelRatio);
      canvas.height = Math.max(300, rect.height * devicePixelRatio);
      const ctx = canvas.getContext("2d");
      ctx.scale(devicePixelRatio, devicePixelRatio);
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = img;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const s = socketRef?.current;
    if (!s) return;
    const onStroke = ({ stroke }) => drawStroke(stroke, false);
    const onClear = () => { const c = canvasRef.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height); };
    s.on("whiteboard:stroke", onStroke);
    s.on("whiteboard:clear", onClear);
    return () => { s.off("whiteboard:stroke", onStroke); s.off("whiteboard:clear", onClear); };
  });
  const pos = (e) => { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; };
  const drawStroke = (stroke, emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const r = canvas.getBoundingClientRect();
    const sx = r.width / (stroke.w || r.width);
    const sy = r.height / (stroke.h || r.height);
    ctx.strokeStyle = stroke.erase ? "#0f172a" : stroke.color;
    ctx.lineWidth = stroke.erase ? stroke.width * 3 : stroke.width;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.moveTo(stroke.from.x * sx, stroke.from.y * sy);
    ctx.lineTo(stroke.to.x * sx, stroke.to.y * sy);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    if (emit) socketRef?.current?.emit("whiteboard:stroke", { roomCode, stroke });
  };
  const down = (e) => { drawing.current = pos(e); canvasRef.current.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e);
    const stroke = { from: drawing.current, to: p, w: p.w, h: p.h, color, width, erase };
    drawing.current = { x: p.x, y: p.y };
    drawStroke(stroke, true);
  };
  const up = () => { drawing.current = null; };
  const clear = () => {
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    socketRef?.current?.emit("whiteboard:clear", { roomCode });
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
        <button onClick={() => setErase(false)} aria-label="Pencil" title="Pencil" className={"call-btn !h-9 !w-9 " + (!erase ? "call-btn-active" : "")}>{<Brush size={16} />}</button>
        <button onClick={() => setErase(true)} aria-label="Eraser" title="Eraser" className={"call-btn !h-9 !w-9 " + (erase ? "call-btn-active" : "")}>{<Eraser size={16} />}</button>
        <div className="flex gap-1.5">{COLORS.map((c) => <button key={c} onClick={() => { setColor(c); setErase(false); }} aria-label={"Color " + c} className={"h-7 w-7 rounded-full border-2 " + (color === c && !erase ? "border-white" : "border-transparent")} style={{ background: c }} />)}</div>
        <input type="range" min="1" max="12" value={width} onChange={(e) => setWidth(Number(e.target.value))} aria-label="Stroke width" className="w-24 accent-cyan-300" />
        <button onClick={clear} aria-label="Clear board" title="Clear board" className="call-btn !h-9 !w-9 ml-auto"><Trash2 size={16} /></button>
      </div>
      <div className="relative min-h-[320px] flex-1 bg-slate-950">
        <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
      </div>
    </div>
  );
}
