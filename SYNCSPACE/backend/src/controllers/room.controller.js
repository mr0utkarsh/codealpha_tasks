import crypto from "node:crypto";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import prisma from "../lib/prisma.js";
import { normalizeRoomCode } from "../lib/roomCode.js";
import { created, noContent, ok } from "../lib/respond.js";

function generateRoomCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8).replace(/(.{4})(.{4})/, "$1-$2");
}

async function uniqueRoomCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const existing = await prisma.room.findUnique({ where: { roomCode: code } });
    if (!existing) return code;
  }
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

async function requireMembership(roomCode, userId) {
  const room = await prisma.room.findUnique({ where: { roomCode: normalizeRoomCode(roomCode) } });
  if (!room) throw ApiError.notFound("Room not found.");
  const membership = await prisma.roomParticipant.findUnique({ where: { roomId_userId: { roomId: room.id, userId } } });
  if (!membership) throw ApiError.forbidden("You are not a member of this room.");
  return room;
}

export const listRooms = asyncHandler(async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { participants: { some: { userId: req.user.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { messages: true, files: true, participants: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: { select: { id: true, name: true } } } },
    },
    take: 50,
  });
  ok(res, { rooms });
});

export const createRoom = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const roomCode = await uniqueRoomCode();
  const room = await prisma.room.create({
    data: {
      name, roomCode, ownerId: req.user.id,
      participants: { create: { userId: req.user.id } },
    },
    include: { owner: { select: { id: true, name: true } } },
  });
  created(res, { room });
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await requireMembership(req.params.roomCode, req.user.id);
  const full = await prisma.room.findUnique({
    where: { id: room.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      participants: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
      _count: { select: { messages: true, files: true } },
    },
  });
  ok(res, { room: full });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { roomCode: normalizeRoomCode(req.params.roomCode) } });
  if (!room) throw ApiError.notFound("Room not found.");
  if (room.ownerId !== req.user.id) throw ApiError.forbidden("Only the room owner can delete this room.");
  await prisma.room.delete({ where: { id: room.id } });
  noContent(res);
});

export const joinRoom = asyncHandler(async (req, res) => {
  const roomCode = normalizeRoomCode(req.params.roomCode);
  const room = await prisma.room.findUnique({ where: { roomCode } });
  if (!room) throw ApiError.notFound("Room not found. Check the room ID and try again.");
  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    update: { leftAt: null },
    create: { roomId: room.id, userId: req.user.id },
  });
  const full = await prisma.room.findUnique({
    where: { id: room.id },
    include: { owner: { select: { id: true, name: true } } },
  });
  ok(res, { room: full });
});

export const leaveRoom = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { roomCode: normalizeRoomCode(req.params.roomCode) } });
  if (!room) throw ApiError.notFound("Room not found.");
  await prisma.roomParticipant.updateMany({
    where: { roomId: room.id, userId: req.user.id },
    data: { leftAt: new Date() },
  });
  ok(res, { left: true });
});

export default { listRooms, createRoom, getRoom, deleteRoom, joinRoom, leaveRoom };
