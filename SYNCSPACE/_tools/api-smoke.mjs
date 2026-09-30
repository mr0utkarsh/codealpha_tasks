/**
 * End-to-end API smoke test for SYNCSPACE.
 * Run: node _tools/api-smoke.mjs
 */
const BASE = "http://localhost:5004/api";
let pass = 0;
let fail = 0;

function ok(label, cond, extra = "") {
  if (cond) { pass += 1; console.log("  PASS  " + label); }
  else { fail += 1; console.log("  FAIL  " + label + (extra ? " -> " + extra : "")); }
}

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const stamp = Date.now();
const A = { name: "Ada Lovelace", email: `ada.${stamp}@syncspace.dev`, password: "Passw0rd!23" };
const B = { name: "Grace Hopper", email: `grace.${stamp}@syncspace.dev`, password: "Passw0rd!23" };

console.log("\n== HEALTH ==");
const health = await call("GET", "/health");
ok("GET /health returns ok", health.json?.data?.status === "ok");

console.log("\n== PROTECTED ROUTE GUARD ==");
const noAuth = await call("GET", "/rooms");
ok("GET /rooms without token -> 401", noAuth.status === 401, "got " + noAuth.status);
const badAuth = await call("GET", "/rooms", { token: "not-a-real-token" });
ok("GET /rooms with bad token -> 401", badAuth.status === 401, "got " + badAuth.status);

console.log("\n== VALIDATION ==");
const weak = await call("POST", "/auth/register", {
  body: { name: "X", email: "nope", password: "123", confirmPassword: "456" },
});
ok("register rejects invalid payload -> 4xx", weak.status >= 400 && weak.status < 500, "got " + weak.status);
const mismatch = await call("POST", "/auth/register", {
  body: { name: "Test User", email: `mm.${stamp}@syncspace.dev`, password: "Passw0rd!23", confirmPassword: "Different!23" },
});
ok("register rejects password mismatch -> 4xx", mismatch.status >= 400 && mismatch.status < 500, "got " + mismatch.status);

console.log("\n== REGISTRATION ==");
const regA = await call("POST", "/auth/register", {
  body: { name: A.name, email: A.email, password: A.password, confirmPassword: A.password },
});
ok("register user A -> 2xx", regA.status >= 200 && regA.status < 300, JSON.stringify(regA.json));
ok("register returns a token", typeof regA.json?.data?.token === "string");
ok("register never leaks the password", !JSON.stringify(regA.json).includes(A.password));
const tokenA = regA.json?.data?.token;

const dupe = await call("POST", "/auth/register", {
  body: { name: A.name, email: A.email, password: A.password, confirmPassword: A.password },
});
ok("duplicate email -> 4xx", dupe.status >= 400 && dupe.status < 500, "got " + dupe.status);

const regB = await call("POST", "/auth/register", {
  body: { name: B.name, email: B.email, password: B.password, confirmPassword: B.password },
});
const tokenB = regB.json?.data?.token;
ok("register user B -> 2xx", Boolean(tokenB));

console.log("\n== LOGIN ==");
const login = await call("POST", "/auth/login", { body: { email: A.email, password: A.password } });
ok("login with correct password -> 2xx", login.status >= 200 && login.status < 300, JSON.stringify(login.json));
const badLogin = await call("POST", "/auth/login", { body: { email: A.email, password: "wrong-password" } });
ok("login with wrong password -> 401", badLogin.status === 401, "got " + badLogin.status);

console.log("\n== CURRENT USER ==");
const me = await call("GET", "/auth/me", { token: tokenA });
ok("GET /auth/me -> 200", me.status === 200, "got " + me.status);
ok("GET /auth/me returns the right email", me.json?.data?.user?.email === A.email);

console.log("\n== ROOM CREATION ==");
const created = await call("POST", "/rooms", { token: tokenA, body: { name: "Smoke Test Room" } });
ok("POST /rooms -> 2xx", created.status >= 200 && created.status < 300, JSON.stringify(created.json));
const room = created.json?.data?.room;
const roomCode = room?.roomCode;
ok("room has a roomCode", typeof roomCode === "string" && roomCode.length > 0, String(roomCode));
ok("room has the requested name", room?.name === "Smoke Test Room");

console.log("\n== ROOM LISTING ==");
const list = await call("GET", "/rooms", { token: tokenA });
ok("GET /rooms -> 200", list.status === 200);
const rooms = list.json?.data?.rooms ?? [];
ok("GET /rooms includes the new room", rooms.some((r) => r.roomCode === roomCode), "count=" + rooms.length);

console.log("\n== ROOM ACCESS CONTROL ==");
const byCode = await call("GET", `/rooms/${roomCode}`, { token: tokenA });
ok("owner can GET room by code -> 200", byCode.status === 200, JSON.stringify(byCode.json));
const otherPeek = await call("GET", `/rooms/${roomCode}`, { token: tokenB });
ok("non-member GET room by code -> 403", otherPeek.status === 403, "got " + otherPeek.status);
const otherMessages = await call("GET", `/rooms/${roomCode}/messages`, { token: tokenB });
ok("non-member messages -> 403", otherMessages.status === 403, "got " + otherMessages.status);
const missing = await call("GET", "/rooms/ZZZZ-9999", { token: tokenA });
ok("unknown room code -> 404", missing.status === 404, "got " + missing.status);

console.log("\n== MESSAGES ==");
const seedMsgs = await call("GET", `/rooms/${roomCode}/messages`, { token: tokenA });
ok("owner GET messages -> 200", seedMsgs.status === 200, "got " + seedMsgs.status);
ok("messages array is returned", Array.isArray(seedMsgs.json?.data?.messages));
console.log("\n== FILES ==");
const filesBefore = await call("GET", `/rooms/${roomCode}/files`, { token: tokenA });
ok("GET files -> 200", filesBefore.status === 200, JSON.stringify(filesBefore.json));
ok("files array is returned", Array.isArray(filesBefore.json?.data?.files));

const boundary = "----syncspaceSmokeBoundary";
const text = "SYNCSPACE smoke test file contents\n";
const multipart =
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="smoke-notes.txt"\r\n` +
  `Content-Type: text/plain\r\n\r\n` +
  text +
  `\r\n--${boundary}--\r\n`;

const upRes = await fetch(`${BASE}/rooms/${roomCode}/files`, {
  method: "POST",
  headers: { Authorization: "Bearer " + tokenA, "Content-Type": "multipart/form-data; boundary=" + boundary },
  body: multipart,
});
const upJson = await upRes.json().catch(() => null);
ok("POST file upload -> 2xx", upRes.status >= 200 && upRes.status < 300, "got " + upRes.status + " " + JSON.stringify(upJson));
const uploaded = upJson?.data?.file;
ok("upload returns file metadata", Boolean(uploaded?.fileName), JSON.stringify(upJson));
ok("upload records the size", typeof uploaded?.fileSize === "number" && uploaded.fileSize > 0, String(uploaded?.fileSize));
ok("upload records the mime type", typeof uploaded?.mimeType === "string", String(uploaded?.mimeType));

const filesAfter = await call("GET", `/rooms/${roomCode}/files`, { token: tokenA });
const fileList = filesAfter.json?.data?.files ?? [];
ok("uploaded file appears in the list", fileList.some((f) => f.fileName === "smoke-notes.txt"), "count=" + fileList.length);

const badUpload = await fetch(`${BASE}/rooms/${roomCode}/files`, {
  method: "POST",
  headers: { Authorization: "Bearer " + tokenB, "Content-Type": "multipart/form-data; boundary=" + boundary },
  body: multipart,
});
ok("non-member file upload -> 403", badUpload.status === 403, "got " + badUpload.status);

const staticRes = await fetch(`http://localhost:5004${uploaded?.fileUrl ?? "/uploads/none"}`);
ok("uploaded file is downloadable from /uploads", staticRes.status === 200, "got " + staticRes.status);
ok("downloaded bytes match the upload", (await staticRes.text()) === text);

console.log("\n== DASHBOARD ==");
const dash = await call("GET", "/dashboard", { token: tokenA });
ok("GET /dashboard -> 200", dash.status === 200, JSON.stringify(dash.json).slice(0, 200));
ok("dashboard returns rooms", Array.isArray(dash.json?.data?.rooms));
ok("dashboard returns recentMessages activity feed", Array.isArray(dash.json?.data?.recentMessages));
ok("dashboard returns recentFiles", Array.isArray(dash.json?.data?.recentFiles));
ok("dashboard returns stats", typeof dash.json?.data?.stats?.rooms === "number");
ok("dashboard rooms carry the counts the UI renders", (dash.json?.data?.rooms ?? []).every((r) => r._count && typeof r._count.messages === "number"));

console.log("\n== ROOM DELETION ==");
const delByOther = await call("DELETE", `/rooms/${roomCode}`, { token: tokenB });
ok("non-owner cannot delete room -> 403", delByOther.status === 403, "got " + delByOther.status);
const del = await call("DELETE", `/rooms/${roomCode}`, { token: tokenA });
ok("owner can delete room -> 2xx", del.status >= 200 && del.status < 300, "got " + del.status + " " + JSON.stringify(del.json));
const afterDel = await call("GET", `/rooms/${roomCode}`, { token: tokenA });
ok("deleted room is gone -> 404", afterDel.status === 404, "got " + afterDel.status);

console.log("\n=============================");
console.log("  PASSED: " + pass + "   FAILED: " + fail);
console.log("=============================\n");
process.exit(fail === 0 ? 0 : 1);