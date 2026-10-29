const SESSION_KEY = 'activitySession';

function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession() {
  return parseJson(sessionStorage.getItem(SESSION_KEY));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
