import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash("password123", 10);
  const alice = await prisma.user.upsert({ where: { email: "alice@syncspace.dev" }, update: {}, create: { name: "Alice Rivera", email: "alice@syncspace.dev", password } });
  const bob = await prisma.user.upsert({ where: { email: "bob@syncspace.dev" }, update: {}, create: { name: "Bob Chen", email: "bob@syncspace.dev", password } });
  const cara = await prisma.user.upsert({ where: { email: "cara@syncspace.dev" }, update: {}, create: { name: "Cara Patel", email: "cara@syncspace.dev", password } });
  const room = await prisma.room.upsert({ where: { roomCode: "ABCD-1234" }, update: {}, create: { roomCode: "ABCD-1234", name: "Design Sync", ownerId: alice.id } });
  await prisma.roomParticipant.upsert({ where: { roomId_userId: { roomId: room.id, userId: alice.id } }, update: {}, create: { roomId: room.id, userId: alice.id } });
  await prisma.roomParticipant.upsert({ where: { roomId_userId: { roomId: room.id, userId: bob.id } }, update: {}, create: { roomId: room.id, userId: bob.id } });
  await prisma.roomParticipant.upsert({ where: { roomId_userId: { roomId: room.id, userId: cara.id } }, update: {}, create: { roomId: room.id, userId: cara.id } });
  await prisma.message.createMany({ data: [
    { roomId: room.id, userId: alice.id, content: "Welcome to SYNCSPACE!" },
    { roomId: room.id, userId: bob.id, content: "Audio check - can you hear me?" },
    { roomId: room.id, userId: cara.id, content: "Whiteboard is ready for sketches." }
  ] });
  await prisma.sharedFile.createMany({ data: [
    { roomId: room.id, userId: alice.id, fileName: "agenda.pdf", fileUrl: "/uploads/agenda.pdf", fileSize: 48210, mimeType: "application/pdf" },
    { roomId: room.id, userId: bob.id, fileName: "mockup.png", fileUrl: "/uploads/mockup.png", fileSize: 210344, mimeType: "image/png" }
  ] });
  console.log("Seed complete.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
