/**
 * Real-time Socket.IO signaling smoke test for SYNCSPACE.
 * Simulates two browser tabs with two different authenticated users and
 * verifies every documented socket event actually flows between them.
 *
 * Run: node _tools/socket-smoke.mjs
 */
import { io } from "../frontend/node_modules/socket.io-client/build/esm/index.js";

const API = "http://localhost:5004";
let pass = 0;
let fail = 0;

function ok(label, cond, extra = "") {
  if (cond) { pass += 1; console.log("  PASS  " + label); }
  else { fail += 1; console.log("  FAIL  " + label + (extra ? " -> " + extra : "")); }
}

async function apiCall(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + "/api" + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(API, { auth: { token }, transports: ["websocket"], forceNew: true });
    const timer = setTimeout(() => reject(new Error("socket connect timeout")), 8000);
    socket.on("connect", () => { clearTimeout(timer); resolve(socket); });
    socket.on("connect_error", (e) => { clearTimeout(timer); reject(e); });
  });
}

/** Resolves with the first payload of `event`, or rejects after `ms`. */
function once(socket, event, ms = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, h); reject(new Error("timeout waiting for " + event)); }, ms);
    const h = (payload) => { clearTimeout(timer); socket.off(event, h); resolve(payload); };
    socket.on(event, h);
  });
}

const stamp = Date.now();
const pw = "Passw0rd!23";
const regA = await apiCall("POST", "/auth/register", {
  body: { name: "Ria Signal", email: `ria.${stamp}@syncspace.dev`, password: pw, confirmPassword: pw },
});
const regB = await apiCall("POST", "/auth/register", {
  body: { name: "Nico Peer", email: `nico.${stamp}@syncspace.dev`, password: pw, confirmPassword: pw },
});
const tokenA = regA.json?.data?.token;
const tokenB = regB.json?.data?.token;
ok("two test users registered", Boolean(tokenA && tokenB));

const created = await apiCall("POST", "/rooms", { token: tokenA, body: { name: "Signaling Test Room" } });
const roomCode = created.json?.data?.room?.roomCode;
ok("room created", Boolean(roomCode), String(roomCode));
await apiCall("POST", `/rooms/${roomCode}/join`, { token: tokenB });

console.log("\n== SOCKET AUTH ==");
let authErr = null;
try { await connect("garbage-token"); } catch (e) { authErr = e; }
ok("socket with invalid token is rejected", Boolean(authErr), authErr ? "rejected" : "CONNECTED ANYWAY");
ok("rejection message is meaningful", /expired|invalid|required/i.test(authErr?.message ?? ""), authErr?.message);

console.log("\n== ROOM JOIN ==");
const a = await connect(tokenA);
const b = await connect(tokenB);
ok("client A connected", a.connected);
ok("client B connected", b.connected);

const joinAckA = await new Promise((res) => a.emit("room:join", { roomCode }, res));
ok("A room:join ack ok", joinAckA?.ok === true, JSON.stringify(joinAckA));
ok("A sees an empty room first", Array.isArray(joinAckA?.participants) && joinAckA.participants.length === 0);

// A is already in the room, so A (not B) receives B's participant:joined.
const joinedAtA = once(a, "participant:joined");
const joinAckB = await new Promise((res) => b.emit("room:join", { roomCode }, res));
ok("B room:join ack ok", joinAckB?.ok === true, JSON.stringify(joinAckB));
const p = await joinedAtA;
ok("A is notified when B joins", Boolean(p?.socketId), JSON.stringify(p));
ok("participant:joined carries the name", p?.name === "Nico Peer", p?.name);
ok("joining peer receives the existing participant list", joinAckB?.participants?.some((x) => x.name === "Ria Signal"), JSON.stringify(joinAckB?.participants));

console.log("\n== MEMBERSHIP ENFORCEMENT ==");
const outsider = await apiCall("POST", "/auth/register", {
  body: { name: "Outsider", email: `out.${stamp}@syncspace.dev`, password: pw, confirmPassword: pw },
});
const c = await connect(outsider.json.data.token);
const badJoin = await new Promise((res) => c.emit("room:join", { roomCode }, res));
ok("non-member cannot join the socket room", badJoin?.ok === false, JSON.stringify(badJoin));
ok("non-member rejection explains membership", /member|API/i.test(badJoin?.error ?? ""), badJoin?.error);
c.disconnect();
console.log("\n== WEBRTC SIGNALING RELAY ==");
// A is the offerer, B the answerer. B's socketId (from the server) === b.id.
ok("server-assigned socketId matches the client id", p.socketId === b.id, p.socketId + " vs " + b.id);

const offerAtB = once(b, "webrtc:offer");
a.emit("webrtc:offer", { to: b.id, sdp: { type: "offer", sdp: "v=0-fake-sdp-for-relay" } });
const gotOffer = await offerAtB;
ok("webrtc:offer is relayed to the target peer", gotOffer?.sdp?.type === "offer", JSON.stringify(gotOffer));
ok("relayed offer is tagged with the sender socketId", gotOffer?.from === a.id, "from=" + gotOffer?.from);

const answerAtA = once(a, "webrtc:answer");
b.emit("webrtc:answer", { to: a.id, sdp: { type: "answer", sdp: "v=0-fake-answer" } });
const gotAnswer = await answerAtA;
ok("webrtc:answer is relayed", gotAnswer?.sdp?.type === "answer", JSON.stringify(gotAnswer));

const iceAtA = once(a, "webrtc:ice-candidate");
b.emit("webrtc:ice-candidate", { to: a.id, candidate: { candidate: "candidate:1 1 udp", sdpMid: "0" } });
const gotIce = await iceAtA;
ok("webrtc:ice-candidate is relayed", gotIce?.candidate?.candidate?.startsWith("candidate:"), JSON.stringify(gotIce));

console.log("\n== MEDIA STATE ==");
const mediaAtB = once(b, "media:state");
a.emit("media:state", { roomCode, audio: false, video: true, screening: false });
const media = await mediaAtB;
ok("media:state relays mic-off", media?.audio === false, JSON.stringify(media));
ok("media:state relays cam-on", media?.video === true);
ok("media:state identifies the sender", media?.from === a.id || media?.socketId === a.id, JSON.stringify(media));

const screenAtB = once(b, "screen:start");
a.emit("screen:start", { roomCode });
const scr = await screenAtB;
ok("screen:start notifies the room", Boolean(scr?.socketId), JSON.stringify(scr));
const screenStopAtB = once(b, "screen:stop");
a.emit("screen:stop", { roomCode });
ok("screen:stop notifies the room", Boolean((await screenStopAtB)?.socketId));

console.log("\n== CHAT ==");
const chatAtB = once(b, "chat:message");
const chatAck = await new Promise((res) => a.emit("chat:message", { roomCode, content: "Hello from A" }, res));
ok("chat:message ack ok", chatAck?.ok === true, JSON.stringify(chatAck));
const chat = await chatAtB;
ok("B receives A's message instantly", chat?.content === "Hello from A", JSON.stringify(chat));
ok("message carries sender name", chat?.user?.name === "Ria Signal", chat?.user?.name);
ok("message has an id and timestamp", Boolean(chat?.id) && Boolean(chat?.createdAt));

const persisted = await apiCall("GET", `/rooms/${roomCode}/messages`, { token: tokenB });
ok("chat message persisted to PostgreSQL", persisted.json?.data?.messages?.some((m) => m.content === "Hello from A"));

const nonMemberChat = await new Promise(async (res) => {
  const s = await connect(outsider.json.data.token);
  const ack = await new Promise((r) => s.emit("chat:message", { roomCode, content: "sneaky" }, r));
  s.disconnect();
  res(ack);
});
ok("non-member cannot chat into a room", nonMemberChat?.ok === false, JSON.stringify(nonMemberChat));

const blank = await new Promise((res) => a.emit("chat:message", { roomCode, content: "   " }, res));
ok("empty chat message is rejected", blank?.ok === false, JSON.stringify(blank));
console.log("\n== WHITEBOARD ==");
const strokeAtB = once(b, "whiteboard:stroke");
a.emit("whiteboard:stroke", { roomCode, stroke: { points: [[1, 2], [3, 4]], color: "#22d3ee", width: 4 } });
const stroke = await strokeAtB;
ok("whiteboard:stroke relays to peers", Array.isArray(stroke?.stroke?.points), JSON.stringify(stroke));
ok("stroke keeps color and width", stroke?.stroke?.color === "#22d3ee" && stroke?.stroke?.width === 4);
const clearAtB = once(b, "whiteboard:clear");
a.emit("whiteboard:clear", { roomCode });
ok("whiteboard:clear relays to peers", (await clearAtB) !== null);

console.log("\n== FILE SHARE EVENT ==");
const fileAtB = once(b, "file:shared");
a.emit("file:shared", { roomCode, file: { id: "f1", fileName: "deck.pdf", fileSize: 100, mimeType: "application/pdf" } });
const shared = await fileAtB;
ok("file:shared relays the file", shared?.file?.fileName === "deck.pdf", JSON.stringify(shared));
ok("file:shared attributes the sharer", shared?.sharedBy?.name === "Ria Signal");

console.log("\n== ROOM LEAVE ==");
const leftAtA = once(a, "participant:left");
b.emit("room:leave", { roomCode });
const left = await leftAtA;
ok("participant:left is emitted on leave", left?.socketId === b.id, JSON.stringify(left));
ok("participant:left carries the name", left?.name === "Nico Peer", left?.name);

console.log("\n== DISCONNECT CLEANUP ==");
// B left above; rejoin so we can observe an abrupt disconnect from the other side.
await new Promise((res) => b.emit("room:join", { roomCode }, res));
// Capture ids first: socket.io-client resets socket.id to undefined on disconnect.
const aId = a.id;
const leftOnDc = once(b, "participant:left");
a.disconnect();
const dc = await leftOnDc;
ok("abrupt disconnect also emits participant:left", dc?.socketId === aId, JSON.stringify(dc) + " expected " + aId);
ok("disconnect cleanup identifies who left", dc?.name === "Ria Signal", dc?.name);

b.disconnect();
await apiCall("DELETE", `/rooms/${roomCode}`, { token: tokenA });

console.log("\n=============================");
console.log("  PASSED: " + pass + "   FAILED: " + fail);
console.log("=============================\n");
process.exit(fail === 0 ? 0 : 1);