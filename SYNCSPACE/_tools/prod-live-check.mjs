/**
 * LIVE production two-device verification.
 * Hits the real Railway backend + checks the real Vercel bundle.
 * Run: node _tools/prod-live-check.mjs
 */
const API = "https://syncspace-api-production-a987.up.railway.app";
const FRONTEND = "https://codealpha-syncspace-ltv9va6qk-mr0utkarsh.vercel.app";
let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (cond ? "" : " -> " + extra));
  cond ? pass++ : fail++;
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + "/api" + path, {
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

// 1. Deployed Vercel bundle must point at Railway, never itself.
const html = await (await fetch(FRONTEND)).text();
const asset = html.match(/src="([^"]+\.js)"/)?.[1];
const bundle = asset ? await (await fetch(FRONTEND + asset)).text() : "";
ok("Vercel bundle loads", bundle.length > 10000, String(bundle.length));
ok("Vercel bundle targets Railway backend", bundle.includes("syncspace-api-production-a987.up.railway.app"));
ok("Vercel bundle has no window.location.origin fallback", !bundle.includes("window.location.origin"));
ok("Vercel bundle has no localhost:5004", !bundle.includes("localhost:5004"));

// 2. Two devices, one shared PostgreSQL room.
const stamp = Date.now();
const a = await call("POST", "/auth/register", { body: { name: "Live A", email: `livea${stamp}@test.dev`, password: "password123", confirmPassword: "password123" } });
const b = await call("POST", "/auth/register", { body: { name: "Live B", email: `liveb${stamp}@test.dev`, password: "password123", confirmPassword: "password123" } });
const tokenA = a.json?.data?.token;
const tokenB = b.json?.data?.token;
ok("device A registers on production", a.status < 300 && tokenA, String(a.status));
ok("device B registers on production", b.status < 300 && tokenB, String(b.status));

const created = await call("POST", "/rooms", { token: tokenA, body: { name: "Live cross-device" } });
const roomCode = created.json?.data?.room?.roomCode;
ok("device A creates room on production", created.status < 300 && roomCode, String(created.status));

const messy = "  " + String(roomCode).toLowerCase();
const joined = await call("POST", `/rooms/${encodeURIComponent(messy)}/join`, { token: tokenB });
ok("device B joins same code on production", joined.status < 300, String(joined.status) + " " + JSON.stringify(joined.json));

const both = await call("GET", `/rooms/${encodeURIComponent(roomCode)}`, { token: tokenA });
const names = (both.json?.data?.room?.participants ?? []).map((p) => p.user?.name).sort();
ok("both devices share the PostgreSQL room", names.includes("Live A") && names.includes("Live B"), JSON.stringify(names));

// 3. Socket.IO from the production Vercel origin with JWT.
const { io } = await import("../frontend/node_modules/socket.io-client/build/esm/index.js");
const socket = io(API, { auth: { token: tokenB }, extraHeaders: { origin: FRONTEND + "/" }, transports: ["polling"] });
const connected = await new Promise((resolve) => {
  const t = setTimeout(() => resolve(false), 8000);
  socket.on("connect", () => { clearTimeout(t); resolve(true); });
  socket.on("connect_error", () => { clearTimeout(t); resolve(false); });
});
ok("Socket.IO accepts Vercel origin + JWT on production", connected);
const joinAck = connected ? await new Promise((res) => socket.emit("room:join", { roomCode }, res)) : null;
ok("Socket.IO joins the shared room", joinAck?.ok === true, JSON.stringify(joinAck));
socket.disconnect();

// Cleanup
await call("DELETE", `/rooms/${roomCode}`, { token: tokenA });

console.log("\n=============================");
console.log(`  PASSED: ${pass}   FAILED: ${fail}`);
console.log("=============================");
process.exit(fail ? 1 : 0);
