"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  X,
  Users,
  Building2,
  Package,
  BarChart3,
  ArrowRightLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import WorkflowNotificationManager from "@/components/WorkflowNotificationManager";
import { syncPullFromCloud } from "@/lib/sync";
import { isRouteAllowedForRole } from "@/lib/role-routing";
import {
  getPersistentSession,
  savePersistentSession,
  clearPersistentSession,
} from "@/lib/auth-session";
import { getDataConnectionStatus, getNotifications, searchCompany, clearAllOlderForms } from "@/lib/data";
import type { NotificationItem, SearchResult } from "@/lib/types";

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

interface StaffOption {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  badge: string;
  initials: string;
}

const AVAILABLE_STAFF: StaffOption[] = [
  {
    id: "radha",
    name: "Radha",
    email: "radha@nunesinstruments.com",
    roleTitle: "Branch Office Intake & Files",
    badge: "Branch Office",
    initials: "RD",
  },
  {
    id: "suganya",
    name: "Suganya",
    email: "suganya@nunesinstruments.com",
    roleTitle: "Branch Office Intake & Files",
    badge: "Branch Office",
    initials: "SG",
  },
  {
    id: "senthil",
    name: "Senthil Kumar",
    email: "senthil@nunesinstruments.com",
    roleTitle: "Service Engineer (30%/50% Scope)",
    badge: "Workshop Repair",
    initials: "SK",
  },
  {
    id: "aravindh",
    name: "Aravindh",
    email: "aravindh@nunesinstruments.com",
    roleTitle: "Workshop Logistics & Branch Transport",
    badge: "Transport & Pickup",
    initials: "AR",
  },
  {
    id: "priya",
    name: "Azhalaku Priya",
    email: "azhalakupriya@nunesinstruments.com",
    roleTitle: "Commercial & Quotations Lead",
    badge: "Quotations",
    initials: "AP",
  },
  {
    id: "md",
    name: "Managing Director (MD)",
    email: "md@nunesinstruments.com",
    roleTitle: "Executive Operations Command",
    badge: "Full Access",
    initials: "MD",
  },
];

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/forms", label: "Forms Hub", icon: FileText },
  { href: "/quotations", label: "Quotations", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/equipment", label: "Equipment", icon: Package },
  { href: "/tasks", label: "Tasks", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setRows([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await searchCompany(value);
        setRows(r.results || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);
  };

  const go = (r: SearchResult) => {
    setOpen(false);
    setQ("");
    router.push(`/process/${r.source}/${encodeURIComponent(String(r.id))}`);
  };

  return (
    <div className="global-search">
      <Search />
      <input
        value={q}
        onChange={(e) => change(e.target.value)}
        onFocus={() => rows.length && setOpen(true)}
        placeholder="Search order, service job, customer, product, worker…"
        aria-label="Search company records"
      />
      <kbd>Ctrl K</kbd>
      {loading && <span className="search-loader" />}
      {open && (
        <div className="search-popover">
          {rows.length ? (
            rows.slice(0, 10).map((r, i) => (
              <button key={`${r.source}-${r.id}-${i}`} onClick={() => go(r)}>
                <span className={`source-mark ${r.source}`}>
                  {r.source === "purchasing" ? "P" : "S"}
                </span>
                <span className="search-copy">
                  <b>
                    {r.record_no} · {r.title}
                  </b>
                  <small>
                    {r.source === "purchasing" ? "Purchasing" : "Servicing"} · {r.stage} · {r.subtitle}
                  </small>
                </span>
                <span className="search-status">{r.status}</span>
              </button>
            ))
          ) : (
            <div className="empty compact">No matching company records.</div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    getNotifications()
      .then((r) => {
        setItems(r.items || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [open]);

  return (
    <div className="notify-wrap">
      <button className="icon-button" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Bell />
        {items.length > 0 && <span className="notify-count">{Math.min(items.length, 99)}</span>}
      </button>
      {open && (
        <div className="notify-popover">
          <div className="popover-title">
            <div>
              <b>Needs attention</b>
              <span>Operational alerts from live form records</span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
          <div className="notify-list">
            {!loaded ? (
              <div className="empty compact">Loading alerts…</div>
            ) : items.length ? (
              items.slice(0, 12).map((n) => (
                <Link
                  prefetch={false}
                  href={n.href || "/tasks"}
                  key={n.id}
                  onClick={() => setOpen(false)}
                  className={`notify-item ${n.severity}`}
                >
                  <span className="notify-dot" />
                  <span>
                    <b>{n.title}</b>
                    <small>{n.detail}</small>
                  </span>
                </Link>
              ))
            ) : (
              <div className="empty compact">
                <CheckCircle2 /> No process needs attention right now.
              </div>
            )}
          </div>
          <Link prefetch={false} href="/tasks" className="popover-footer" onClick={() => setOpen(false)}>
            Open work queue
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [dataState, setDataState] = useState<"checking" | "online" | "offline">("checking");
  const [showSwitchModal, setShowSwitchModal] = useState(false);

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

  const active = (href: string) => {
    if (href === "/dashboard") return path === "/" || path === "/dashboard";
    return path.startsWith(href);
  };

  // Sync pull across devices & check local auth session
  useEffect(() => {
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

  // Real-time listener for login/switch across all tabs
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

  // Data connection check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const s = await getDataConnectionStatus();
        if (!cancelled) setDataState(s.online ? "online" : "offline");
      } catch {
        if (!cancelled) setDataState("offline");
      }
    };
    const connected = () => {
      if (!cancelled) setDataState("online");
    };
    const timer = window.setTimeout(check, 120);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 15000);
    window.addEventListener("nunes:data-bridge-connected", connected as EventListener);
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener("nunes:data-bridge-connected", connected as EventListener);
      window.removeEventListener("focus", check);
    };
  }, []);

  // Global Ctrl+K hotkey
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        (document.querySelector(".global-search input") as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Public routes
  if (path === "/" || path === "/landing" || path === "/login") {
    // If accessing root, allow it to render or redirect
  }

  const emailLower = (userEmail || "").toLowerCase().trim();
  const currentStaff = AVAILABLE_STAFF.find((s) => emailLower.includes(s.id)) || {
    id: "admin",
    name: userEmail ? userEmail.split("@")[0].toUpperCase() : "Management",
    email: userEmail || "admin@nunesinstruments.com",
    roleTitle: "Operations Administrator",
    badge: "Admin",
    initials: "AD",
  };

  const handleSwitchStaff = (staff: StaffOption) => {
    savePersistentSession(staff.email, staff.id);
    setShowSwitchModal(false);
    window.dispatchEvent(new CustomEvent("nunes:auth-changed"));
    window.location.reload();
  };

  const handleLogout = () => {
    clearPersistentSession();
    window.location.href = "/login";
  };

  return (
    <div className={`shell ${path === "/" ? "dashboard-shell" : ""}`}>
      {/* EXACT ORIGINAL INSTRUASIA SIDEBAR */}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brandmark">N</div>
          <div>
            <b>NUNES</b>
            <span>Operations Workspace</span>
          </div>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>

        <nav className="nav">
          {nav.map((n) => {
            const I = (n.href === "/" || n.href === "/dashboard") && (path === "/" || path === "/dashboard")
              ? LayoutDashboard
              : n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch={false}
                onClick={() => setMobile(false)}
                className={active(n.href) ? "active" : ""}
              >
                <I />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="side-foot">
          {path === "/" || path === "/dashboard" ? (
            <>
              <b>Management workspace</b>
              <span>Live Purchasing and Servicing operations in one clear owner view.</span>
              <em>NUNES · V6.6.8</em>
            </>
          ) : (
            <>
              <b>Modular company platform</b>
              <span>
                Purchasing and Servicing are operational modules. 30+ completed records loaded.
              </span>
              <em>V6.6.8</em>
            </>
          )}
        </div>
      </aside>

      {mobile && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}

      {/* EXACT ORIGINAL INSTRUASIA MAIN VIEWPORT & TOPBAR */}
      <div className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(true)}>
            <Menu />
          </button>

          <SearchBox />

          <div className="top-actions">
            <div className={`live-pill ${dataState}`}>
              <span className="dot" />
              {dataState === "online"
                ? "Data connected"
                : dataState === "offline"
                ? "Data offline"
                : "Checking data"}
            </div>

            <NotificationCenter />

            {/* Role & Operator Identity Pill with Switch Button */}
            <div
              className="role-pill"
              style={{ cursor: "pointer" }}
              onClick={() => setShowSwitchModal(true)}
              title="Click to switch workstation operator profile"
            >
              <span>Operator</span>
              <b style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {currentStaff.name}
                <ArrowRightLeft size={11} style={{ opacity: 0.6 }} />
              </b>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      {/* QUICK OPERATOR SWITCH MODAL */}
      {showSwitchModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSwitchModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <b style={{ fontSize: "14px" }}>Select Workstation Operator</b>
                <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  Switch operator role and authorized permissions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                style={{ border: 0, background: "transparent", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "10px", display: "grid", gap: "6px" }}>
              {AVAILABLE_STAFF.map((staff) => {
                const isSelected = emailLower.includes(staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleSwitchStaff(staff)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid var(--brand)" : "1px solid var(--line)",
                      background: isSelected ? "#eef4ff" : "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: isSelected ? "var(--brand)" : "#f1f5f9",
                          color: isSelected ? "#fff" : "#475569",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "11px",
                        }}
                      >
                        {staff.initials}
                      </div>
                      <div>
                        <b style={{ fontSize: "12px", display: "block" }}>{staff.name}</b>
                        <span style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>
                          {staff.roleTitle}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "3px 7px",
                        borderRadius: "6px",
                        background: isSelected ? "var(--brand)" : "#f1f5f9",
                        color: isSelected ? "#fff" : "#64748b",
                      }}
                    >
                      {staff.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "var(--red)",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                <LogOut size={13} />
                <span>Log out session</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowSwitchModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW NOTIFICATION MANAGER */}
      <WorkflowNotificationManager />
    </div>
  );
}
