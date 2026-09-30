import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import prisma from "../lib/prisma.js";

function sanitize(content) {
  return String(content ?? "").replace(/\0/g, "").trim().slice(0, 2000);
}

const rooms = new Map();

function roomMap(roomCode) {
  if (!rooms.has(roomCode)) rooms.set(roomCode, new Map());
  return rooms.get(roomCode);
}

function publicList(roomCode) {
  const map = rooms.get(roomCode);
  if (!map) return [];
  return [...map.values()].map((p) => ({
    socketId: p.socketId, userId: p.userId, name: p.name,
    audio: p.audio, video: p.video, screening: p.screening,
  }));
}

export function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required."));
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, avatar: true },
      });
      if (!user) return next(new Error("Account no longer exists."));
      socket.user = user;
      next();
    } catch { next(new Error("Session expired or invalid.")); }
  });

  io.on("connection", (socket) => {
    socket.emit("connection:status", { status: "connected", socketId: socket.id });
    socket.data.rooms = new Set();

    socket.on("room:join", async ({ roomCode } = {}, ack) => {
      try {
        const code = String(roomCode ?? "").trim().toUpperCase();
        if (!code) throw new Error("Room ID is required.");
        const room = await prisma.room.findUnique({ where: { roomCode: code } });
        if (!room) throw new Error("Room not found.");
        const membership = await prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: room.id, userId: socket.user.id } },
        });
        if (!membership) throw new Error("Join the room via API first (not a member).");
        await socket.join(code);
        socket.data.rooms.add(code);
        const map = roomMap(code);
        const existing = publicList(code);
        map.set(socket.id, {
          socketId: socket.id, userId: socket.user.id, name: socket.user.name,
          audio: true, video: true, screening: false,
        });
        socket.to(code).emit("participant:joined", {
          socketId: socket.id, userId: socket.user.id, name: socket.user.name,
          audio: true, video: true, screening: false,
        });
        socket.emit("room:participants", { roomCode: code, participants: existing });
        if (typeof ack === "function") ack({ ok: true, participants: existing });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
        else socket.emit("room:error", { message: err.message });
      }
    });

    async function leaveRoomCode(code, notify = true) {
      const map = rooms.get(code);
      const entry = map?.get(socket.id);
      if (map) map.delete(socket.id);
      if (map && map.size === 0) rooms.delete(code);
      socket.data.rooms.delete(code);
      try { await socket.leave(code); } catch {}
      if (notify && entry) {
        socket.to(code).emit("participant:left", { socketId: socket.id, userId: entry.userId, name: entry.name });
      }
      try {
        const room = await prisma.room.findUnique({ where: { roomCode: code } });
        if (room) {
          await prisma.roomParticipant.updateMany({
            where: { roomId: room.id, userId: socket.user.id },
            data: { leftAt: new Date() },
          });
        }
      } catch {}
    }

    socket.on("room:leave", async ({ roomCode } = {}, ack) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (code) await leaveRoomCode(code, true);
      if (typeof ack === "function") ack({ ok: true });
    });

    const forward = (event) => (payload = {}) => {
      const to = payload?.to;
      if (!to) return;
      io.to(to).emit(event, { ...payload, from: socket.id });
    };
    socket.on("webrtc:offer", forward("webrtc:offer"));
    socket.on("webrtc:answer", forward("webrtc:answer"));
    socket.on("webrtc:ice-candidate", forward("webrtc:ice-candidate"));

    socket.on("media:state", ({ roomCode, audio, video, screening } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code) return;
      const map = rooms.get(code);
      const entry = map?.get(socket.id);
      if (entry) {
        if (typeof audio === "boolean") entry.audio = audio;
        if (typeof video === "boolean") entry.video = video;
        if (typeof screening === "boolean") entry.screening = screening;
      }
      socket.to(code).emit("media:state", {
        socketId: socket.id, userId: socket.user.id,
        audio: entry?.audio ?? audio ?? true,
        video: entry?.video ?? video ?? true,
        screening: entry?.screening ?? screening ?? false,
      });
    });

    socket.on("screen:start", ({ roomCode } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code) return;
      const map = rooms.get(code);
      const entry = map?.get(socket.id);
      if (entry) entry.screening = true;
      socket.to(code).emit("screen:start", { socketId: socket.id, userId: socket.user.id, name: socket.user.name });
    });

    socket.on("screen:stop", ({ roomCode } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code) return;
      const map = rooms.get(code);
      const entry = map?.get(socket.id);
      if (entry) entry.screening = false;
      socket.to(code).emit("screen:stop", { socketId: socket.id, userId: socket.user.id });
    });

    socket.on("chat:message", async ({ roomCode, content } = {}, ack) => {
      try {
        const code = String(roomCode ?? "").trim().toUpperCase();
        const text = sanitize(content);
        if (!code || !text) throw new Error("Message content is required.");
        const room = await prisma.room.findUnique({ where: { roomCode: code } });
        if (!room) throw new Error("Room not found.");
        const membership = await prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: room.id, userId: socket.user.id } },
        });
        if (!membership) throw new Error("Not a room member.");
        const message = await prisma.message.create({
          data: { roomId: room.id, userId: socket.user.id, content: text },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        });
        io.to(code).emit("chat:message", {
          id: message.id, content: message.content, createdAt: message.createdAt,
          roomCode: code, user: message.user,
        });
        if (typeof ack === "function") ack({ ok: true });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    socket.on("whiteboard:stroke", ({ roomCode, stroke } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code || !stroke) return;
      socket.to(code).emit("whiteboard:stroke", { stroke, from: socket.id });
    });

    socket.on("whiteboard:clear", ({ roomCode } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code) return;
      socket.to(code).emit("whiteboard:clear", { from: socket.id });
    });

    socket.on("file:shared", ({ roomCode, file } = {}) => {
      const code = String(roomCode ?? "").trim().toUpperCase();
      if (!code || !file) return;
      io.to(code).emit("file:shared", { file, sharedBy: { id: socket.user.id, name: socket.user.name } });
    });

    socket.on("disconnect", async () => {
      for (const code of [...socket.data.rooms]) await leaveRoomCode(code, true);
    });
  });
}

export function getRoomPresence() {
  const out = {};
  for (const [code, map] of rooms) out[code] = map.size;
  return out;
}
