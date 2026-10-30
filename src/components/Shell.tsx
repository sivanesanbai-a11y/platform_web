"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThreeInteractiveAuth from "@/components/auth/ThreeInteractiveAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { syncPullFromCloud } from "@/lib/sync";

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const releaseRef = useRef<string>("");
  const reloadingRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Sync pull across devices & check local auth session
  useEffect(() => {
    // 1. Cross-device synchronization on page load
    void syncPullFromCloud();

    // 2. Auth session verification
    try {
      const s = localStorage.getItem("nunes_auth_session");
      if (s) {
        let email = "";
        try {
          const parsed = JSON.parse(s);
          email = typeof parsed === "string" ? parsed : (parsed?.email || "");
        } catch {
          email = s;
        }
        if (email) {
          setIsAuthenticated(true);
        }
      }
    } catch {}
    setAuthChecked(true);

    const handleFocus = () => {
      void syncPullFromCloud();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

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
    const poll = window.setInterval(() => void checkRelease(), 10000);
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

  // If user is accessing protected routes without session, show the 3D Interactive Auth Gate
  if (authChecked && !isAuthenticated) {
    return (
      <ThreeInteractiveAuth
        onSuccess={() => {
          setIsAuthenticated(true);
        }}
        redirectTo={path || "/dashboard"}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="shell relative flex min-h-screen w-full bg-white">
        {/* MODERN SIDEBAR */}
        <AppSidebar />

        {/* FLOATING MOBILE MENU TRIGGER (ONLY ON SCREENS < 768px) */}
        <div className="fixed top-3 left-3 z-30 md:hidden">
          <SidebarTrigger className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-md hover:bg-slate-50 transition-colors" />
        </div>

        {/* MAIN VIEWPORT - DIRECT PAGE CONTENT WITHOUT ANY TOPBAR OCCUPYING SPACE */}
        <div className="app-main-viewport flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden w-full bg-white">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </SidebarProvider>
  );
}
