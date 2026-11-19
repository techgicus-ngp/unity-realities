/* The sanctioned area has its own unlock, separate from the normal
   sign-in. It lives in sessionStorage, so closing the tab locks it, and
   it expires after TTL_MS of the unlock even if the tab stays open. */

const KEY = 'sanctioned_gate';
const TTL_MS = 30 * 60 * 1000;

export function isUnlocked(uid) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const g = JSON.parse(raw);
    if (g.uid !== uid || Date.now() > g.until) { sessionStorage.removeItem(KEY); return false; }
    return true;
  } catch {
    return false;
  }
}

export function unlock(uid) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ uid, until: Date.now() + TTL_MS })); } catch { /* private mode */ }
}

export function lock() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
