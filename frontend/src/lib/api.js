const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated() {
  return !!getToken();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = { status: res.status, ...err };
    throw error;
  }
  return res.json();
}

// Auth
export const register = (email, password) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Sessions
export const startSession = () => request("/sessions/start", { method: "POST" });
export const sendMessage = (sessionId, content) =>
  request(`/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
export const exitSession = (sessionId) =>
  request(`/sessions/${sessionId}/exit`, { method: "POST" });
export const getMessages = (sessionId) =>
  request(`/sessions/${sessionId}/messages`);
export const checkCooldown = () => request("/sessions/cooldown");
export const getSessionHistory = () => request("/sessions/history");

// Dreams
export const createDream = (content) =>
  request("/dreams/", { method: "POST", body: JSON.stringify({ content }) });
export const listDreams = () => request("/dreams/");

// Notes
export const createNote = (content) =>
  request("/notes/", { method: "POST", body: JSON.stringify({ content }) });
export const listNotes = () => request("/notes/");

// Voice
export async function transcribeAudio(blob) {
  const token = getToken();
  const form = new FormData();
  form.append("file", blob, "recording.webm");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/voice/transcribe`, {
    method: "POST",
    body: form,
    headers,
  });
  if (!res.ok) throw new Error("Transcription failed");
  return res.json();
}
