import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters.").max(80),
});

export const roomCodeParam = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Za-z0-9-]+$/, "Invalid room code."),
});

export const messageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  before: z.string().datetime({ offset: true }).optional(),
});
