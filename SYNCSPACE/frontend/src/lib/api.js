const DEV_DEFAULT_API_URL = "http://localhost:5004";
const BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEV_DEFAULT_API_URL : window.location.origin)
).replace(/\/$/, "");
export const API_BASE = BASE;
function token() { return localStorage.getItem("syncspace_token") || ""; }
async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const t = token();
  if (t) headers.Authorization = "Bearer " + t;
  const res = await fetch(BASE + path, { ...options, headers });
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
  getRoom: (code) => request("/api/rooms/" + encodeURIComponent(code)),
  deleteRoom: (code) => request("/api/rooms/" + encodeURIComponent(code), { method: "DELETE" }),
  joinRoom: (code) => request("/api/rooms/" + encodeURIComponent(code) + "/join", { method: "POST" }),
  leaveRoom: (code) => request("/api/rooms/" + encodeURIComponent(code) + "/leave", { method: "POST" }),
  messages: (code) => request("/api/rooms/" + encodeURIComponent(code) + "/messages?limit=200"),
  files: (code) => request("/api/rooms/" + encodeURIComponent(code) + "/files"),
  uploadFile: (code, file, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", BASE + "/api/rooms/" + encodeURIComponent(code) + "/files");
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
  summarizeChat: (code) => request("/api/ai/chat/" + encodeURIComponent(code) + "/summarize", { method: "POST" }),
  rewriteMessage: (message, tone) => request("/api/ai/chat/rewrite", { method: "POST", body: JSON.stringify({ message, tone }) }),
  suggestReplies: (code) => request("/api/ai/chat/" + encodeURIComponent(code) + "/suggest-replies", { method: "POST" }),
};
export default api;
