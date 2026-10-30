"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Search,
  LayoutGrid,
  CheckSquare,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import CommandPalette from "@/components/CommandPalette";
import type { ServiceJob } from "@/types/service-job";
import type { PurchasingOrder } from "@/types/purchasing-order";

export interface AppSidebarProps {
  onDeleteForms?: () => void;
}

export default function AppSidebar({ onDeleteForms }: AppSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();

  let isMobile = false;
  let openMobile = false;
  let setOpenMobile: (open: boolean) => void = () => {};
  try {
    const sidebar = useSidebar();
    isMobile = sidebar.isMobile;
    openMobile = sidebar.openMobile;
    setOpenMobile = sidebar.setOpenMobile;
  } catch {
    // fallback if used outside provider
  }

  const [commandOpen, setCommandOpen] = useState(false);
  const [serviceCount, setServiceCount] = useState(1);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nunes_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nunes_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Check if current logged-in user is Admin or MD
  const isAdminOrMd = Boolean(
    userEmail &&
      (userEmail.toLowerCase().includes("admin") ||
        userEmail.toLowerCase().includes("md") ||
        userEmail.toLowerCase().startsWith("md@") ||
        userEmail.toLowerCase().startsWith("admin@"))
  );

  // Read live counts from localStorage & reactive sync
  useEffect(() => {
    const updateCounts = () => {
      try {
        const rawService = localStorage.getItem("nunes:service_jobs");
        if (rawService) {
          const sJobs: ServiceJob[] = JSON.parse(rawService);
          setServiceCount(Math.max(1, sJobs.length));
        }

        const rawPurchase = localStorage.getItem("nunes:purchasing_orders");
        if (rawPurchase) {
          const pOrders: PurchasingOrder[] = JSON.parse(rawPurchase);
          setPurchaseCount(pOrders.length);
        }

        const sessionRaw = localStorage.getItem("nunes_auth_session");
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw);
          if (parsed?.email) setUserEmail(parsed.email);
        }
      } catch {}
    };

    updateCounts();
    window.addEventListener("nunes:records-synced", updateCounts);
    return () => window.removeEventListener("nunes:records-synced", updateCounts);
  }, [pathname]);

  // Global hotkeys: Ctrl+K / Cmd+K and two-key shortcuts (G then key)
  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (lastKey === "g" && now - lastKeyTime < 600) {
        if (key === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (key === "t") {
          e.preventDefault();
          router.push("/tasks");
        } else if (key === "a") {
          e.preventDefault();
          router.push("/activity");
        } else if (key === "s") {
          e.preventDefault();
          router.push("/forms/servicing");
        } else if (key === "p") {
          e.preventDefault();
          router.push("/forms/servicing");
        } else if (key === "r") {
          e.preventDefault();
          router.push("/reports");
        }
        lastKey = "";
        return;
      }

      if (key === "g") {
        lastKey = "g";
        lastKeyTime = now;
      } else {
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const displayName = userEmail
    ? userEmail.toLowerCase().startsWith("md")
      ? "MD (Management)"
      : userEmail
          .replace(/@.*$/, "")
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Operator Profile";

  const userInitial = userEmail
    ? userEmail.toLowerCase().startsWith("md")
      ? "MD"
      : userEmail.charAt(0).toUpperCase()
    : "N";

  // Full Expanded Sidebar Content
  const renderExpandedContent = () => (
    <div className="flex flex-col h-full justify-between select-none font-sans">
      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Workspace / Branch Profile Header */}
        <div className="px-3 pt-3 pb-1.5">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/40 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                N
              </div>
              <div className="flex flex-col text-left min-w-0 leading-tight">
                <span className="text-xs font-bold text-slate-800 truncate">
                  NUNES Instrumentation
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Coimbatore
                </span>
              </div>
            </div>

            {/* Minimize Sidebar Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              title="Minimize sidebar to fit page"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
        </div>

        {/* Search Bar with Ctrl K */}
        <div className="px-3 py-1 mb-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 text-xs hover:border-slate-300 hover:text-slate-600 shadow-2xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Search</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 font-medium">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Section: Overview */}
        <div className="px-3">
          <div className="text-[11px] font-medium text-slate-400 px-3 pt-2 pb-1">
            Overview
          </div>
          <div className="flex flex-col gap-0.5">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/dashboard"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/dashboard" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={15} className={pathname === "/dashboard" ? "text-slate-900" : "text-slate-500"} />
                <span>Dashboard</span>
              </div>
            </Link>

            {/* My tasks */}
            <Link
              href="/tasks"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/tasks"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/tasks" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <CheckSquare size={15} className={pathname === "/tasks" ? "text-slate-900" : "text-slate-500"} />
                <span>My tasks</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
            </Link>
          </div>
        </div>

        {/* Section: Operations */}
        <div className="px-3 mt-3">
          <div className="text-[11px] font-medium text-slate-400 px-3 pt-2 pb-1">
            Operations
          </div>
          <div className="flex flex-col gap-0.5">
            {/* Forms Hub */}
            <Link
              href="/forms"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/forms" || pathname?.startsWith("/forms/")
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {(pathname === "/forms" || pathname?.startsWith("/forms/")) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={pathname === "/forms" || pathname?.startsWith("/forms/") ? "text-slate-900" : "text-slate-500"} />
                <span>Forms</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {serviceCount > 0 ? serviceCount : 33}
              </span>
            </Link>

            {/* Quotations */}
            <Link
              href="/quotations"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/quotations"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/quotations" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={pathname === "/quotations" ? "text-slate-900" : "text-slate-500"} />
                <span>Quotations</span>
              </div>
            </Link>

            {/* Products & Photos Catalog */}
            <Link
              href="/products"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/products"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/products" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <Package size={15} className={pathname === "/products" ? "text-slate-900" : "text-slate-500"} />
                <span>Products &amp; Photos</span>
              </div>
            </Link>

            {/* Customers */}
            <Link
              href="/customers"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/customers"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/customers" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <Users size={15} className={pathname === "/customers" ? "text-slate-900" : "text-slate-500"} />
                <span>Customers</span>
              </div>
            </Link>

            {/* Suppliers */}
            <Link
              href="/suppliers"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/suppliers"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/suppliers" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <Package size={15} className={pathname === "/suppliers" ? "text-slate-900" : "text-slate-500"} />
                <span>Suppliers</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Section: Insights */}
        <div className="px-3 mt-3">
          <div className="text-[11px] font-medium text-slate-400 px-3 pt-2 pb-1">
            Insights
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/reports"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/reports"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/reports" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <BarChart3 size={15} className={pathname === "/reports" ? "text-slate-900" : "text-slate-500"} />
                <span>Reports</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Section: Workspace */}
        <div className="px-3 mt-3">
          <div className="text-[11px] font-medium text-slate-400 px-3 pt-2 pb-1">
            Workspace
          </div>
          <div className="flex flex-col gap-0.5">
            {/* Team Profiles / My Profile */}
            <Link
              href="/team"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/team"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/team" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <Users size={15} className={pathname === "/team" ? "text-slate-900" : "text-slate-500"} />
                <span>{isAdminOrMd ? "Team Profiles (All)" : "My Profile"}</span>
              </div>
            </Link>

            <Link
              href="/settings"
              onClick={handleNavClick}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === "/settings"
                  ? "bg-slate-200/70 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 font-medium"
              }`}
            >
              {pathname === "/settings" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <div className="flex items-center gap-2.5">
                <Settings size={15} className="text-slate-500" />
                <span>Settings</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM PINNED USER PROFILE CARD (LOW DOWN AT VERY BOTTOM) */}
      <div className="shrink-0 p-3 border-t border-slate-200/80 bg-slate-50/95">
        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <Link
            href="/team"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer no-underline"
            title="Click to view & edit your Personal Operator Profile"
          >
            <div className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-[12px] grid place-items-center shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold leading-tight">
                View Profile →
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("nunes_auth_session");
              } catch {}
              window.location.href = "/login";
            }}
            title="Sign Out"
            className="text-[11px] text-slate-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  // Minimized / Collapsed Compact Sidebar (w-16, Fits page)
  const renderCollapsedContent = () => (
    <div className="flex flex-col h-full justify-between items-center py-3 select-none font-sans">
      {/* Top: Logo & Expand Button */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
          N
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          title="Expand sidebar"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <PanelLeftOpen size={16} />
        </button>
      </div>

      {/* Middle: Centered Icon Navigation */}
      <div className="flex flex-col items-center gap-1.5 overflow-y-auto my-auto py-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          title="Search (Ctrl+K)"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <Search size={16} />
        </button>

        <Link
          href="/dashboard"
          title="Dashboard"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/dashboard"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <LayoutGrid size={16} />
        </Link>

        <Link
          href="/tasks"
          title="Tasks"
          className={`relative p-2 rounded-lg transition-colors ${
            pathname === "/tasks"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <CheckSquare size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 ring-1 ring-white" />
        </Link>

        <Link
          href="/forms"
          title="Forms"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/forms" || pathname?.startsWith("/forms/")
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <FileText size={16} />
        </Link>

        <Link
          href="/quotations"
          title="Quotations"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/quotations"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <Sparkles size={16} />
        </Link>

        <Link
          href="/products"
          title="Products & Photos"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/products"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <Package size={16} />
        </Link>

        <Link
          href="/customers"
          title="Customers"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/customers"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <Users size={16} />
        </Link>

        <Link
          href="/reports"
          title="Reports"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/reports"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <BarChart3 size={16} />
        </Link>

        <Link
          href="/team"
          title={isAdminOrMd ? "Team Profiles (All)" : "My Profile"}
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/team"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <UserCheck size={16} />
        </Link>

        <Link
          href="/settings"
          title="Settings"
          className={`p-2 rounded-lg transition-colors ${
            pathname === "/settings"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <Settings size={16} />
        </Link>
      </div>

      {/* Bottom Pinned: Operator Avatar Circle */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200/80 w-full px-2">
        <Link
          href="/team"
          title={`${displayName} - View My Profile`}
          className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs grid place-items-center shadow-xs hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer"
        >
          {userInitial}
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("nunes_auth_session");
            } catch {}
            window.location.href = "/login";
          }}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* COMMAND PALETTE DIALOG (Ctrl K) */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* MOBILE SLIDE-OVER DRAWER (FOR SCREENS < 768px) */}
      {openMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-slate-50 border-r border-slate-200/90 flex flex-col justify-between select-none font-sans overflow-hidden z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {renderExpandedContent()}
          </aside>
        </div>
      )}

      {/* MODERN DESKTOP SIDEBAR (Collapsible to fit page, Pinned bottom profile) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? "w-16" : "w-64"
        } h-screen flex-shrink-0 bg-slate-50/80 border-r border-slate-200/90 flex-col select-none font-sans overflow-hidden sticky top-0 z-20 transition-all duration-200`}
      >
        {isCollapsed ? renderCollapsedContent() : renderExpandedContent()}
      </aside>
    </>
  );
}
