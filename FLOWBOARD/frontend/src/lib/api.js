const API_URL = import.meta.env.VITE_API_URL || '';

let authToken = localStorage.getItem('flowboard.token') || '';

export function setAuthToken(token) {
  authToken = token || '';
  if (token) localStorage.setItem('flowboard.token', token);
  else localStorage.removeItem('flowboard.token');
}

export function getAuthToken() {
  return authToken;
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      body?.error?.message || body?.message || `Request failed (${res.status}).`;
    const error = new Error(message);
    error.status = res.status;
    error.details = body?.error?.details;
    throw error;
  }
  return body?.data ?? body;
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  return parseResponse(res);
}

export const api = {
  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),

  // Dashboard
  dashboard: () => request('/api/dashboard'),

  // Users
  searchUsers: (q) => request(`/api/users?q=${encodeURIComponent(q || '')}`),

  // Projects
  projects: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/api/projects${qs ? `?${qs}` : ''}`);
  },
  project: (id) => request(`/api/projects/${id}`),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: payload }),
  updateProject: (id, payload) => request(`/api/projects/${id}`, { method: 'PUT', body: payload }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  projectActivity: (id) => request(`/api/projects/${id}/activities`),

  // Members
  members: (projectId) => request(`/api/projects/${projectId}/members`),
  addMember: (projectId, payload) =>
    request(`/api/projects/${projectId}/members`, { method: 'POST', body: payload }),
  removeMember: (projectId, userId) =>
    request(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  // Tasks
  tasks: (projectId, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/api/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`);
  },
  task: (id) => request(`/api/tasks/${id}`),
  createTask: (projectId, payload) =>
    request(`/api/projects/${projectId}/tasks`, { method: 'POST', body: payload }),
  updateTask: (id, payload) => request(`/api/tasks/${id}`, { method: 'PUT', body: payload }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Comments
  comments: (taskId) => request(`/api/tasks/${taskId}/comments`),
  addComment: (taskId, payload) =>
    request(`/api/tasks/${taskId}/comments`, { method: 'POST', body: payload }),
  deleteComment: (id) => request(`/api/comments/${id}`, { method: 'DELETE' }),

  // AI
  generateTaskDescription: (projectId, payload) =>
    request(`/api/ai/projects/${projectId}/task-description`, { method: 'POST', body: payload }),
  generateProjectDescription: (payload) =>
    request('/api/ai/project-description', { method: 'POST', body: payload }),
  assistComment: (taskId, payload) =>
    request(`/api/ai/tasks/${taskId}/comment-assist`, { method: 'POST', body: payload }),
  suggestTasks: (projectId) =>
    request(`/api/ai/projects/${projectId}/task-suggestions`, { method: 'POST' }),
};
