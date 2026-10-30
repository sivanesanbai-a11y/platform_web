export interface AuthSession {
  email: string;
  loggedInAt?: string;
  timestamp?: number;
  role?: string;
  name?: string;
}

const STORAGE_KEY = "nunes_auth_session";
const COOKIE_KEY = "nunes_auth_session";
const COOKIE_MAX_AGE = 31536000; // 365 days (1 full year)

/**
 * Retrieves the persistent session from either localStorage or 1-year persistent cookie fallback.
 * If one is missing, it cross-repairs the other so login session is never lost.
 */
export function getPersistentSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  // 1. Primary: localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed?.email) {
        // Guarantee 1-year cookie is also active
        syncCookie(parsed);
        return parsed;
      }
    }
  } catch {}

  // 2. Secondary Fallback: 1-Year Persistent Cookie
  // (Crucial for mobile browsers, iOS Safari memory cleanup, or webviews where localStorage may be reset)
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )\\s*${COOKIE_KEY}=([^;]+)`));
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const parsed = JSON.parse(decoded) as AuthSession;
      if (parsed?.email) {
        // Self-heal localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Saves the session permanently across both localStorage and 1-year persistent Cookie,
 * and broadcasts an auth event to all open tabs and components.
 */
export function savePersistentSession(sessionOrEmail: AuthSession | string, roleId?: string): void {
  if (typeof window === "undefined") return;

  const session: AuthSession =
    typeof sessionOrEmail === "string"
      ? {
          email: sessionOrEmail,
          role: roleId || sessionOrEmail.split("@")[0],
          name: sessionOrEmail.split("@")[0].toUpperCase(),
          loggedInAt: new Date().toISOString(),
        }
      : sessionOrEmail;

  const serialized = JSON.stringify(session);

  // 1. Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {}

  // 2. Save to 1-Year Cookie
  syncCookie(session);

  // 3. Broadcast to all open tabs and active components
  try {
    window.dispatchEvent(new CustomEvent("nunes:auth-changed", { detail: session }));
  } catch {}
}

/**
 * Clears the session from both localStorage and Cookie.
 */
export function clearPersistentSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("nunes_active_staff_id");
  } catch {}

  try {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("nunes:auth-changed", { detail: null }));
  } catch {}
}

function syncCookie(session: AuthSession): void {
  try {
    const serialized = encodeURIComponent(JSON.stringify(session));
    document.cookie = `${COOKIE_KEY}=${serialized}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {}
}
