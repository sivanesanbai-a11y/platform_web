"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import WorkflowNotificationManager from "@/components/WorkflowNotificationManager";
import { syncPullFromCloud, sortJobsDeterministically } from "@/lib/sync";
import { isRouteAllowedForRole } from "@/lib/role-routing";
import { getPersistentSession } from "@/lib/auth-session";

const ThreeInteractiveAuth = dynamic(
  () => import("@/components/auth/ThreeInteractiveAuth"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Opening NUNES Gateway...</span>
        </div>
      </div>
    ),
  }
);

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const releaseRef = useRef<string>("");
  const reloadingRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const session = getPersistentSession();
    return Boolean(session?.email);
  });
  const [authChecked, setAuthChecked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return true;
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const session = getPersistentSession();
    return session?.email || "";
  });

  const checkAuthSession = useCallback(() => {
    const session = getPersistentSession();
    if (session?.email) {
      setIsAuthenticated(true);
      setUserEmail(session.email);
      return session.email;
    }
    setIsAuthenticated(false);
    setUserEmail("");
    return null;
  }, []);

  // Sync pull across devices & check local auth session
  useEffect(() => {
    // 1. Cross-device synchronization on page load
    void syncPullFromCloud();

    const handleFocus = () => {
      void syncPullFromCloud();
      checkAuthSession();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAuthSession]);

  // Re-verify session on mount and whenever path changes
  useEffect(() => {
    checkAuthSession();
    setAuthChecked(true);
  }, [path, checkAuthSession]);

  // Real-time listener for login/switch across all tabs and components
  useEffect(() => {
    const handleAuthChange = () => {
      checkAuthSession();
    };
    window.addEventListener("nunes:auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("nunes:auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [checkAuthSession]);

  // Role-based route enforcement
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;
    // Allow public landing and login pages without forced station redirect
    if (path === "/" || path === "/landing" || path === "/login") return;
    const { allowed, redirectPath } = isRouteAllowedForRole(userEmail, path);
    if (!allowed && path !== redirectPath) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, userEmail, path, router]);

  // Health / release watchdog
  useEffect(() => {
    let cancelled = false;
    const checkRelease = async () => {
      if (cancelled || reloadingRef.current || document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/health?release_check=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) return;
        const h = await r.json();
        const release = String(h?.release_id || h?.version || "").trim();
        if (!release) return;
        if (!releaseRef.current) {
          releaseRef.current = release;
          return;
        }
        if (releaseRef.current !== release) {
          reloadingRef.current = true;
          releaseRef.current = release;
          window.location.reload();
        }
      } catch {
        /* server may be restarting during an update; retry on the next poll */
      }
    };
    void checkRelease();
    const poll = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void checkRelease();
    }, 25000);
    const focus = () => void checkRelease();
    window.addEventListener("focus", focus);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", focus);
    };
  }, []);

  // Public routes (Landing & Dedicated Login)
  if (path === "/" || path === "/landing" || path === "/login") {
    return <>{children}</>;
  }

  // During SSR or before hydration check
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Connecting NUNES Workstation...</span>
        </div>
      </div>
    );
  }

  // If user is accessing protected routes without session, show the 3D Interactive Auth Gate
  if (authChecked && !isAuthenticated) {
    return (
      <ThreeInteractiveAuth
        onSuccess={() => {
          const email = checkAuthSession();
          if (email) {
            const { redirectPath } = isRouteAllowedForRole(email, path);
            window.location.href = redirectPath;
          } else {
            window.location.reload();
          }
        }}
        redirectTo={path || "/dashboard"}
      />
    );
  }

  // Prevent flash of forbidden route while redirecting
  if (isAuthenticated && userEmail) {
    const { allowed } = isRouteAllowedForRole(userEmail, path);
    if (!allowed) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-700">Opening your authorized workstation...</span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="shell relative flex flex-col min-h-screen w-full bg-white dark:bg-black transition-colors duration-150">
      {/* TOPBAR NAVIGATION - EXPANSIVE FULL WIDTH (NO SIDEBAR) */}
      <TopNavbar />

      {/* MAIN VIEWPORT - 100% EXPANSIVE FULL WIDTH */}
      <div className="app-main-viewport flex-1 min-w-0 flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden w-full bg-white dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      {/* WORKFLOW OPERATIONS NOTIFICATION POPUP & TRAY */}
      <WorkflowNotificationManager />
    </div>
  );
}
