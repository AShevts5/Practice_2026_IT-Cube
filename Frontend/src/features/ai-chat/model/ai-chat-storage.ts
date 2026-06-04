const CLIENT_KEY = "aiChatClientKey";
const SESSION_ID = "aiChatSessionId";

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `guest${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}

export function getAiChatClientKey() {
  const existing = localStorage.getItem(CLIENT_KEY);
  if (existing) return existing;
  const value = randomKey();
  localStorage.setItem(CLIENT_KEY, value);
  return value;
}

export function getStoredAiChatSessionId(): number | null {
  const raw = sessionStorage.getItem(SESSION_ID);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setStoredAiChatSessionId(sessionId: number) {
  sessionStorage.setItem(SESSION_ID, String(sessionId));
}

export function clearStoredAiChatSessionId() {
  sessionStorage.removeItem(SESSION_ID);
}
