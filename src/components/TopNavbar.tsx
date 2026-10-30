"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  FolderOpen,
  FileText,
  Users,
  Building2,
  Package,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  Search,
  LogOut,
  ArrowRightLeft,
  X,
  Menu,
  Bell,
} from "lucide-react";
import CommandPalette from "@/components/CommandPalette";
import { getRoleDestination } from "@/lib/role-routing";
import {
  savePersistentSession,
  clearPersistentSession,
  getPersistentSession,
} from "@/lib/auth-session";
import { getAlertsForUser } from "@/lib/workflow-service";

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

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Sync authenticated session & unread workflow alerts
  useEffect(() => {
    const syncUser = () => {
      try {
        const session = getPersistentSession();
        const email = session?.email || userEmail;
        if (session?.email) setUserEmail(session.email);
        if (email) {
          const list = getAlertsForUser(email);
          setUnreadAlerts(list.filter((a) => !a.read).length);
        }
      } catch {}
    };

    syncUser();
    window.addEventListener("nunes:records-synced", syncUser);
    window.addEventListener("nunes:auth-changed", syncUser);
    window.addEventListener("nunes:workflow-alerts-updated", syncUser);
    window.addEventListener("nunes:workflow-notification", syncUser);
    window.addEventListener("focus", syncUser);
    const interval = setInterval(syncUser, 4000);

    return () => {
      window.removeEventListener("nunes:records-synced", syncUser);
      window.removeEventListener("nunes:auth-changed", syncUser);
      window.removeEventListener("nunes:workflow-alerts-updated", syncUser);
      window.removeEventListener("nunes:workflow-notification", syncUser);
      window.removeEventListener("focus", syncUser);
      clearInterval(interval);
    };
  }, [pathname, userEmail]);

  // Global Ctrl+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const emailLower = (userEmail || "").toLowerCase().trim();

  // Role Checks
  const isAdminOrMd = Boolean(
    emailLower &&
      (emailLower.includes("admin") ||
        emailLower.includes("md") ||
        emailLower.startsWith("md@") ||
        emailLower.startsWith("admin@") ||
        emailLower.includes("director"))
  );

  const isAravindh = emailLower.includes("aravind");
  const isSenthil = emailLower.includes("senthil");
  const isPriya = emailLower.includes("priya") || emailLower.includes("azhalaku");
  const isRadha = emailLower.includes("radha");
  const isSuganya = emailLower.includes("suganya");
  const isBranchStaff = isRadha || isSuganya;

  const currentStaff =
    AVAILABLE_STAFF.find((s) => emailLower.includes(s.id)) || {
      id: "operator",
      name: userEmail
        ? userEmail.toLowerCase().startsWith("md")
          ? "Managing Director (MD)"
          : userEmail
              .replace(/@.*$/, "")
              .replace(/[._-]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Nunes Operator",
      email: userEmail || "operator@nunesinstruments.com",
      roleTitle: isAdminOrMd
        ? "Executive Operations Command"
        : isSenthil
        ? "Service Engineer"
        : isAravindh
        ? "Workshop Logistics"
        : isPriya
        ? "Commercial Lead"
        : isBranchStaff
        ? "Branch Office Intake"
        : "Intake Specialist",
      badge: isAdminOrMd ? "Command" : "Station",
      initials: isAdminOrMd
        ? "MD"
        : isSenthil
        ? "SK"
        : isAravindh
        ? "AR"
        : isPriya
        ? "AP"
        : isRadha
        ? "RD"
        : isSuganya
        ? "SG"
        : "N",
    };

  const handleSwitchStaff = (staff: StaffOption) => {
    try {
      const session = {
        email: staff.email,
        timestamp: Date.now(),
        role: staff.id === "md" ? "MD" : "Operator",
      };
      savePersistentSession(session);
      setShowSwitchModal(false);
      window.location.href = getRoleDestination(staff.email);
    } catch {}
  };

  // Primary Navigation items
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutGrid size={15} /> },
    { href: "/forms", label: "Forms Hub", icon: <FolderOpen size={15} /> },
    { href: "/quotations", label: "Quotations", icon: <FileText size={15} /> },
    { href: "/customers", label: "Customers", icon: <Users size={15} /> },
    { href: "/suppliers", label: "Suppliers", icon: <Building2 size={15} /> },
    { href: "/products", label: "Equipment", icon: <Package size={15} /> },
    { href: "/tasks", label: "Tasks", icon: <CheckSquare size={15} /> },
    { href: "/reports", label: "Reports", icon: <BarChart3 size={15} /> },
    ...(isAdminOrMd
      ? [{ href: "/team", label: "Team", icon: <ShieldCheck size={15} /> }]
      : []),
    { href: "/settings", label: "Settings", icon: <Settings size={15} /> },
  ];

  return (
    <>
      {/* COMMAND PALETTE (CTRL+K) */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* TOPBAR NAVIGATION (100% FULL WIDTH - NO SIDEBAR) */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#070b14] border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-150">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
          
          {/* LEFT: BRAND & STATION IDENTITY */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 no-underline group select-none"
              title="Nunes Operations Platform"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/30 group-hover:bg-blue-700 transition-colors">
                N
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  NUNES INSTRUMENTS
                </span>
                <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                  Coimbatore Hub
                </span>
              </div>
            </Link>

            {/* Active User Station Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="truncate max-w-[140px]">{currentStaff.name}</span>
            </div>
          </div>

          {/* CENTER: DESKTOP NAVIGATION TABS (NO TRUNCATION) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 px-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/forms" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-150 select-none whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: SEARCH, THEME TOGGLE, PROFILE & ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Search Button (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Global quick search (Ctrl+K)"
            >
              <Search size={14} />
              <span className="hidden sm:inline text-[11px]">Search</span>
              <kbd className="hidden md:inline px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Workflow Alerts Notification Bell */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("nunes:toggle-workflow-alerts"))}
              className="relative flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer shadow-2xs"
              title={unreadAlerts > 0 ? `${unreadAlerts} unread workflow notification(s)` : "Workflow Notifications"}
            >
              <Bell size={15} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9.5px] font-black text-white shadow-sm ring-2 ring-white dark:ring-black animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Operator Switcher (Admin & MD Only) */}
            {isAdminOrMd && (
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                title="Switch active workstation operator"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowRightLeft size={13} />
                <span className="text-[11px]">Switch</span>
              </button>
            )}

            {/* User Profile Avatar with Link to Profile */}
            <Link
              href="/team"
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors select-none"
              title={`Logged in as ${currentStaff.name}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs grid place-items-center shrink-0 shadow-2xs ring-1 ring-white/20">
                {currentStaff.initials}
              </div>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                clearPersistentSession();
                window.location.href = "/login";
              }}
              title="Sign out of workstation"
              className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>

            {/* Mobile Hamburger Toggle (< 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b14] px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/forms" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Operator Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs grid place-items-center">
                  {currentStaff.initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white leading-tight">
                    {currentStaff.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{currentStaff.roleTitle}</div>
                </div>
              </div>

              {isAdminOrMd && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSwitchModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-[11px]"
                >
                  Switch
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* QUICK SWITCH OPERATOR MODAL - STRICTLY MD & ADMIN ONLY */}
      {isAdminOrMd && showSwitchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-[13px] font-black text-slate-900 dark:text-white">
                  Select Active Workstation Operator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto space-y-1.5">
              {AVAILABLE_STAFF.map((staff) => {
                const isSelected = emailLower.includes(staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleSwitchStaff(staff)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          isSelected ? "bg-white/20" : "bg-blue-600"
                        } text-white font-bold text-xs grid place-items-center shrink-0`}
                      >
                        {staff.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-black truncate">
                          {staff.name}
                        </span>
                        <span
                          className={`text-[10.5px] font-medium truncate mt-0.5 ${
                            isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {staff.roleTitle}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white border-white/20"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {staff.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Instantly loads their role-specific view &amp; permissions</span>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
