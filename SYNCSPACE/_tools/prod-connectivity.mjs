/**
 * Targeted production-connectivity checks:
 *  1. Two users (device A / device B) share one PostgreSQL room.
 *  2. Device B joins with a lowercase, whitespace-padded code -> normalized.
 *  3. Socket.IO accepts the production Vercel origin and authenticates JWT.
 * Run: node _tools/prod-connectivity.mjs
 */
const BASE = process.env.API_URL || "http://localhost:5004";
const PROD_ORIGIN = "https://codealpha-syncspace-ltv9va6qk-mr0utkarsh.vercel.app";
let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (cond ? "" : " -> " + extra));
  cond ? pass++ : fail++;
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const stamp = Date.now();
const a = await call("POST", "/auth/register", { body: { name: "Device A", email: `a${stamp}@test.dev`, password: "password123", confirmPassword: "password123" } });
const b = await call("POST", "/auth/register", { body: { name: "Device B", email: `b${stamp}@test.dev`, password: "password123", confirmPassword: "password123" } });
ok("device A registers", a.status < 300 && a.json?.data?.token, String(a.status));
ok("device B registers", b.status < 300 && b.json?.data?.token, String(b.status));
const tokenA = a.json?.data?.token;
const tokenB = b.json?.data?.token;

const created = await call("POST", "/rooms", { token: tokenA, body: { name: "Cross device" } });
const roomCode = created.json?.data?.room?.roomCode;
ok("device A creates room", created.status < 300 && roomCode, String(created.status));
ok("room code keeps XXXX-XXXX format", /^[A-F0-9]{4}-[A-F0-9]{4}$/.test(roomCode ?? ""), roomCode);

// Device B joins with lowercased + padded code: must normalize and hit PostgreSQL.
const messy = "  " + String(roomCode).toLowerCase() + " \n";
const joined = await call("POST", `/rooms/${encodeURIComponent(messy)}/join`, { token: tokenB });
ok("device B joins with lowercase/padded code", joined.status < 300, String(joined.status) + " " + JSON.stringify(joined.json));

const fetched = await call("GET", `/rooms/${encodeURIComponent(String(roomCode).toLowerCase())}`, { token: tokenB });
ok("device B GETs the same room", fetched.status === 200 && fetched.json?.data?.room?.roomCode === roomCode, String(fetched.status));

const both = await call("GET", `/rooms/${encodeURIComponent(roomCode)}`, { token: tokenA });
const names = (both.json?.data?.room?.participants ?? []).map((p) => p.user?.name).sort();
ok("both devices are participants in PostgreSQL", names.includes("Device A") && names.includes("Device B"), JSON.stringify(names));

// Socket.IO: production origin + JWT must be accepted (CORS_ORIGIN on the
// server must include PROD_ORIGIN - run the server with the Render env).
const { io } = await import("../frontend/node_modules/socket.io-client/build/esm/index.js");
const socket = io(BASE, {
  auth: { token: tokenB },
  extraHeaders: { origin: PROD_ORIGIN },
  transports: ["polling"],
});
const connected = await new Promise((resolve) => {
  const t = setTimeout(() => resolve(false), 5000);
  socket.on("connect", () => { clearTimeout(t); resolve(true); });
  socket.on("connect_error", () => { clearTimeout(t); resolve(false); });
});
ok("Socket.IO accepts production origin + JWT", connected, "connect_error/timeout");

const joinAck = connected ? await new Promise((res) => socket.emit("room:join", { roomCode: " " + roomCode.toLowerCase() + " " }, res)) : null;
ok("Socket.IO room:join with unnormalized code works", joinAck?.ok === true, JSON.stringify(joinAck));
socket.disconnect();

// Cleanup
await call("DELETE", `/rooms/${roomCode}`, { token: tokenA });

console.log("\n=============================");
console.log(`  PASSED: ${pass}   FAILED: ${fail}`);
console.log("=============================");
process.exit(fail ? 1 : 0);
