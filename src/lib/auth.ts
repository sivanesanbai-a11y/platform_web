/**
 * Centralized Authentication & Session Management Utility
 */

export interface AuthSession {
  email: string;
  loggedInAt?: string;
  role?: string;
  name?: string;
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nunes_auth_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.email) {
      return parsed as AuthSession;
    }
  } catch {}
  return null;
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("nunes_auth_session", JSON.stringify(session));
    localStorage.setItem("nunes_active_staff_id", session.email);
    localStorage.setItem("3d_auth_session", JSON.stringify(session));
  } catch {}

  try {
    sessionStorage.setItem("nunes_auth_session", JSON.stringify(session));
  } catch {}

  try {
    document.cookie = `nunes_auth_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("nunes:auth-changed", { detail: session }));
  } catch {}
}

export function performLogout() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("nunes_auth_session");
    localStorage.removeItem("nunes_active_staff_id");
    localStorage.removeItem("3d_auth_session");
  } catch {}

  try {
    sessionStorage.clear();
  } catch {}

  try {
    document.cookie = "nunes_auth_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (typeof window !== "undefined" && window.location.hostname) {
      document.cookie = `nunes_auth_session=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("nunes:auth-changed", { detail: null }));
  } catch {}

  window.location.replace("/");
}
