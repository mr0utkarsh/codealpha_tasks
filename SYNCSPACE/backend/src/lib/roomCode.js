/**
 * Room codes are stored in PostgreSQL exactly as generated: uppercase
 * XXXX-XXXX. Every path that reads a code from a client (REST params,
 * Socket.IO payloads) must normalize it the same way, otherwise a
 * lowercase or padded code from a second device misses the unique index
 * and reports "Room not found".
 */
export function normalizeRoomCode(value) {
  return String(value ?? "").trim().toUpperCase();
}
export default normalizeRoomCode;

