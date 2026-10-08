import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api, { API_BASE, API_BASE_ERROR, normalizeRoomCode } from "../lib/api.js";

const ICE_SERVERS = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

export function useRoom(roomCode, user) {
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const localRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const roomRef = useRef(roomCode);
  const audioCtxRef = useRef(null);
  const speakingRef = useRef(new Map());
  const stopAnalyseRef = useRef(new Map());
  roomRef.current = normalizeRoomCode(roomCode);

  // Real speaking detection: an AnalyserNode per remote stream measuring actual
  // audio energy. This is NOT simulated - a silent stream never lights up.
  const analyse = useCallback((socketId, stream) => {
    try {
      if (!stream.getAudioTracks().length) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const active = sum / data.length > 12;
        if (speakingRef.current.get(socketId) !== active) {
          speakingRef.current.set(socketId, active);
          setSpeaking((prev) => ({ ...prev, [socketId]: active }));
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => {
        cancelAnimationFrame(raf);
        try { source.disconnect(); analyser.disconnect(); } catch {}
      };
    } catch {}
  }, []);

  const patchParticipant = useCallback((socketId, patch) => {
    setParticipants((prev) => prev.map((p) => (p.socketId === socketId ? { ...p, ...patch } : p)));
  }, []);

  const closePeer = useCallback((socketId) => {
    stopAnalyseRef.current.get(socketId)?.();
    stopAnalyseRef.current.delete(socketId);
    speakingRef.current.delete(socketId);
    const pc = peersRef.current.get(socketId);
    if (pc) { try { pc.close(); } catch {} peersRef.current.delete(socketId); }
    setRemoteStreams((prev) => { const n = { ...prev }; delete n[socketId]; return n; });
  }, []);

  const createPeer = useCallback((targetId, initiator) => {
    const existing = peersRef.current.get(targetId);
    if (existing) return existing;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(targetId, pc);
    if (localRef.current) {
      for (const track of localRef.current.getTracks()) pc.addTrack(track, localRef.current);
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) socketRef.current.emit("webrtc:ice-candidate", { to: targetId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      if (stream) {
        setRemoteStreams((prev) => ({ ...prev, [targetId]: stream }));
        stopAnalyseRef.current.get(targetId)?.();
        const stop = analyse(targetId, stream);
        if (stop) stopAnalyseRef.current.set(targetId, stop);
      }
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        setRemoteStreams((prev) => { const n = { ...prev }; delete n[targetId]; return n; });
      }
    };
    (async () => {
      try {
        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("webrtc:offer", { to: targetId, sdp: pc.localDescription });
        }
      } catch {}
    })();
    return pc;
  }, []);

  useEffect(() => {
    if (!roomCode || !user) return;
    // Socket.IO must hit the same backend origin as the REST API. In production
    // that is VITE_API_URL - never the static frontend host.
    if (!API_BASE) {
      setSocketStatus("disconnected");
      setMediaError(API_BASE_ERROR || "API URL is not configured.");
      return;
    }
    const code = normalizeRoomCode(roomCode);
    let cancelled = false;
    const socket = io(API_BASE, { auth: { token: localStorage.getItem("syncspace_token") || "" }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    setSocketStatus("connecting");

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: { echoCancellation: true, noiseSuppression: true } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
      } catch (err) {
        if (!cancelled) setMediaError(err?.name === "NotAllowedError" ? "Camera/microphone permission was denied. Enable it in the browser site settings, then rejoin." : "Could not access camera/microphone (" + (err?.message || err?.name) + ").");
      }
    })();

    // The REST POST /rooms/:code/join that creates the membership row and this
    // socket handshake race each other. If the socket arrives first the server
    // rejects it as a non-member, so we establish membership and retry once.
    const joinWithRetry = (attempt = 0) => {
      socket.emit("room:join", { roomCode: code }, async (res) => {
        if (res?.ok) {
          setMediaError("");
          if (res.participants?.length) {
            setParticipants(res.participants);
            res.participants.forEach((p) => createPeer(p.socketId, true));
          }
          return;
        }
        const notMember = /member/i.test(res?.error ?? "");
        if (notMember && attempt < 3) {
          try { await api.joinRoom(code); } catch { /* retry anyway */ }
          setTimeout(() => { if (!cancelled) joinWithRetry(attempt + 1); }, 400 * (attempt + 1));
          return;
        }
        if (!cancelled) setMediaError(res?.error || "Could not join room.");
      });
    };

    socket.on("connect", () => {
      setSocketStatus("connected");
      joinWithRetry();
    });
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setSocketStatus("reconnecting"));
    socket.io.on("reconnect", () => { setSocketStatus("connected"); joinWithRetry(); });
    socket.on("room:participants", ({ participants: list }) => {
      setParticipants(list || []);
      (list || []).forEach((p) => { if (!peersRef.current.has(p.socketId)) createPeer(p.socketId, true); });
    });
    socket.on("participant:joined", (p) => {
      setParticipants((prev) => (prev.some((x) => x.socketId === p.socketId) ? prev : [...prev, p]));
      createPeer(p.socketId, false);
    });
    socket.on("participant:left", ({ socketId }) => {
      closePeer(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });
    socket.on("webrtc:offer", async ({ from, sdp }) => {
      const pc = createPeer(from, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { to: from, sdp: pc.localDescription });
      } catch {}
    });
    socket.on("webrtc:answer", async ({ from, sdp }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      try { await pc.setRemoteDescription(new RTCSessionDescription(sdp)); } catch {}
    });
    socket.on("webrtc:ice-candidate", async ({ from, candidate }) => {
      const pc = peersRef.current.get(from);
      if (!pc || !candidate) return;
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });
    socket.on("media:state", ({ socketId, audio, video, screening }) => patchParticipant(socketId, { audio, video, screening }));
    socket.on("screen:start", ({ socketId }) => patchParticipant(socketId, { screening: true }));
    socket.on("screen:stop", ({ socketId }) => patchParticipant(socketId, { screening: false }));

    return () => {
      cancelled = true;
      try { socket.emit("room:leave", { roomCode: code }); } catch {}
      socket.disconnect();
      peersRef.current.forEach((pc) => { try { pc.close(); } catch {} });
      peersRef.current.clear();
      stopAnalyseRef.current.forEach((stop) => stop());
      stopAnalyseRef.current.clear();
      if (localRef.current) { localRef.current.getTracks().forEach((t) => t.stop()); localRef.current = null; }
    };
  }, [roomCode, user, createPeer, closePeer, patchParticipant, analyse]);

  const broadcastMedia = useCallback((patch) => {
    const s = socketRef.current;
    if (s) s.emit("media:state", { roomCode: roomRef.current, ...patch });
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return micOn;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
    broadcastMedia({ audio: next, video: camOn });
    return next;
  }, [micOn, camOn, broadcastMedia]);

  const toggleCam = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return camOn;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCamOn(next);
    broadcastMedia({ audio: micOn, video: next });
    return next;
  }, [micOn, camOn, broadcastMedia]);

  const startShare = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen track.");
      const oldCam = cameraTrackRef.current;
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((x) => x.track && x.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      });
      if (localRef.current) {
        if (oldCam) localRef.current.removeTrack(oldCam);
        localRef.current.addTrack(screenTrack);
        setLocalStream(new MediaStream(localRef.current.getTracks()));
      }
      setSharing(true);
      socketRef.current?.emit("screen:start", { roomCode: roomRef.current });
      broadcastMedia({ screening: true });
      screenTrack.onended = () => { stopShare(); };
      return true;
    } catch (err) {
      if (err?.name !== "NotAllowedError") throw err;
      return false;
    }
  }, [broadcastMedia]);

  const stopShare = useCallback(async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      cameraTrackRef.current = camTrack;
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((x) => x.track && x.track.kind === "video");
        if (sender && camTrack) sender.replaceTrack(camTrack).catch(() => {});
      });
      if (localRef.current) {
        localRef.current.getVideoTracks().forEach((t) => { try { localRef.current.removeTrack(t); t.stop(); } catch {} });
        if (camTrack) localRef.current.addTrack(camTrack);
        cam.getAudioTracks().forEach((t) => t.stop());
        setLocalStream(new MediaStream(localRef.current.getTracks()));
      }
    } catch {}
    setSharing(false);
    socketRef.current?.emit("screen:stop", { roomCode: roomRef.current });
    broadcastMedia({ screening: false });
  }, [broadcastMedia]);

  const leave = useCallback(() => {
    try { socketRef.current?.emit("room:leave", { roomCode: roomRef.current }); socketRef.current?.disconnect(); } catch {}
    peersRef.current.forEach((pc) => { try { pc.close(); } catch {} });
    peersRef.current.clear();
    stopAnalyseRef.current.forEach((stop) => stop());
    stopAnalyseRef.current.clear();
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    if (localRef.current) { localRef.current.getTracks().forEach((t) => t.stop()); localRef.current = null; }
  }, []);

  return { socket: socketRef, socketStatus, participants, remoteStreams, localStream, mediaError, micOn, camOn, sharing, speaking, toggleMic, toggleCam, startShare, stopShare, leave };
}
export default useRoom;
