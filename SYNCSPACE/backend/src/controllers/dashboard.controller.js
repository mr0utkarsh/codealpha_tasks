import { asyncHandler } from "../lib/asyncHandler.js";
import prisma from "../lib/prisma.js";
import { ok } from "../lib/respond.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [rooms, messageCount, fileCount, recentMessages, recentFiles] = await Promise.all([
    prisma.room.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { messages: true, files: true, participants: true } },
      },
    }),
    prisma.message.count({ where: { room: { participants: { some: { userId } } } } }),
    prisma.sharedFile.count({ where: { room: { participants: { some: { userId } } } } }),
    prisma.message.findMany({
      where: { room: { participants: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { id: true, name: true } }, room: { select: { roomCode: true, name: true } } },
    }),
    prisma.sharedFile.findMany({
      where: { room: { participants: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { id: true, name: true } }, room: { select: { roomCode: true, name: true } } },
    }),
  ]);
  ok(res, { rooms, stats: { rooms: rooms.length, messages: messageCount, files: fileCount }, recentMessages, recentFiles });
});
