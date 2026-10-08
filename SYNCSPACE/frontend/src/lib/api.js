const DEV_DEFAULT_API_URL = "http://localhost:5004";
const MISSING_API_URL_MESSAGE =
  "VITE_API_URL is not set. A production build must point at the deployed Node/Express backend origin (no trailing slash), e.g. https://syncspace-api.onrender.com. Set it in the hosting provider's environment variables and rebuild the frontend.";

function resolveBaseUrl() {
  const configured = (import.meta.env.VITE_API_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  // Local development only: talk to the local API (or the Vite dev proxy).
  // Never fall back to window.location.origin - in production that is the
  // static frontend host, which does not serve the REST API or Socket.IO.
  if (import.meta.env.DEV) return DEV_DEFAULT_API_URL;
  console.error("[syncspace] " + MISSING_API_URL_MESSAGE);
  return null;
}

export const API_BASE = resolveBaseUrl();
export const API_BASE_ERROR = API_BASE ? null : MISSING_API_URL_MESSAGE;

/** Room codes are stored as uppercase XXXX-XXXX; normalize before every use. */
export function normalizeRoomCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

function baseUrl() {
  if (!API_BASE) throw new Error(MISSING_API_URL_MESSAGE);
  return API_BASE;
}
function token() { return localStorage.getItem("syncspace_token") || ""; }
async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const t = token();
  if (t) headers.Authorization = "Bearer " + t;
  const res = await fetch(baseUrl() + path, { ...options, headers });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!res.ok) {
    const msg = json?.error?.message || ("Request failed (" + res.status + ")");
    throw new Error(msg);
  }
  return json?.data ?? {};
}
export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me"),
  dashboard: () => request("/api/dashboard"),
  rooms: () => request("/api/rooms"),
  createRoom: (name) => request("/api/rooms", { method: "POST", body: JSON.stringify({ name }) }),
  getRoom: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code))),
  deleteRoom: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)), { method: "DELETE" }),
  joinRoom: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)) + "/join", { method: "POST" }),
  leaveRoom: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)) + "/leave", { method: "POST" }),
  messages: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)) + "/messages?limit=200"),
  files: (code) => request("/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)) + "/files"),
  uploadFile: (code, file, onProgress) => new Promise((resolve, reject) => {
    let uploadUrl;
    try { uploadUrl = baseUrl(); } catch (err) { reject(err); return; }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl + "/api/rooms/" + encodeURIComponent(normalizeRoomCode(code)) + "/files");
    const t = token();
    if (t) xhr.setRequestHeader("Authorization", "Bearer " + t);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(json.data);
        else reject(new Error(json?.error?.message || "Upload failed."));
      } catch (err) { reject(err); }
    };
    xhr.onerror = () => reject(new Error("Upload failed."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  }),

  // AI
  summarizeChat: (code) => request("/api/ai/chat/" + encodeURIComponent(normalizeRoomCode(code)) + "/summarize", { method: "POST" }),
  rewriteMessage: (message, tone) => request("/api/ai/chat/rewrite", { method: "POST", body: JSON.stringify({ message, tone }) }),
  suggestReplies: (code) => request("/api/ai/chat/" + encodeURIComponent(normalizeRoomCode(code)) + "/suggest-replies", { method: "POST" }),
};
export default api;
