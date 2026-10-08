import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import prisma from "../lib/prisma.js";
import { normalizeRoomCode } from "../lib/roomCode.js";
import { ok } from "../lib/respond.js";

function sanitize(content) {
  return String(content ?? "").replace(/\0/g, "").trim().slice(0, 2000);
}

export const listMessages = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { roomCode: normalizeRoomCode(req.params.roomCode) } });
  if (!room) throw ApiError.notFound("Room not found.");
  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden("You are not a member of this room.");
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 100) || 100));
  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  ok(res, { messages });
});

export const postMessage = asyncHandler(async (req, res) => {
  const content = sanitize(req.body?.content);
  if (!content) throw ApiError.badRequest("Message content is required.");
  const room = await prisma.room.findUnique({ where: { roomCode: normalizeRoomCode(req.params.roomCode) } });
  if (!room) throw ApiError.notFound("Room not found.");
  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden("You are not a member of this room.");
  const message = await prisma.message.create({
    data: { roomId: room.id, userId: req.user.id, content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  ok(res, { message });
});
