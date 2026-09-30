import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import prisma from "../lib/prisma.js";
import { created, ok } from "../lib/respond.js";

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "file";
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + "-" + safe);
  },
});

const BLOCKED = new Set([
  "application/x-msdownload",
  "application/x-sh",
  "application/x-executable",
  "application/x-msdos-program",
]);

/** Marks a fileFilter rejection so the error handler returns 415, not 500. */
function rejectUpload(message) {
  const err = new Error(message);
  err.uploadRejected = true;
  return err;
}

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (BLOCKED.has(file.mimetype)) return cb(rejectUpload("This file type is not allowed."));
    if (/\.(exe|bat|cmd|ps1|sh|msi|com|scr|dll|jar|app)$/.test(name)) return cb(rejectUpload("Executable files are not allowed."));
    cb(null, true);
  },
});

export const listFiles = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { roomCode: req.params.roomCode } });
  if (!room) throw ApiError.notFound("Room not found.");
  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden("You are not a member of this room.");
  const files = await prisma.sharedFile.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
    take: 100,
  });
  ok(res, { files });
});

export const uploadFile = asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { roomCode: req.params.roomCode } });
  if (!room) throw ApiError.notFound("Room not found.");
  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden("You are not a member of this room.");
  if (!req.file) throw ApiError.badRequest("No file was uploaded.");
  const record = await prisma.sharedFile.create({
    data: {
      roomId: room.id,
      userId: req.user.id,
      fileName: req.file.originalname.slice(0, 200),
      fileUrl: "/uploads/" + req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || "application/octet-stream",
    },
    include: { user: { select: { id: true, name: true } } },
  });
  created(res, { file: record });
});
