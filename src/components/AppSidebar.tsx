"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  CheckSquare,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Wrench,
  Truck,
  Building2,
  ChevronRight,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  User,
  X,
  ShoppingCart,
  FolderOpen,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import CommandPalette from "@/components/CommandPalette";
import { getRoleDestination } from "@/lib/role-routing";
import { savePersistentSession, clearPersistentSession, getPersistentSession } from "@/lib/auth-session";
import ThemeToggle from "@/components/ThemeToggle";

export interface AppSidebarProps {
  onDeleteForms?: () => void;
}

interface StaffOption {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  badge: string;
  badgeColor: string;
  avatarBg: string;
  initials: string;
}

const AVAILABLE_STAFF: StaffOption[] = [
  {
    id: "radha",
    name: "Radha",
    email: "radha@nunesinstruments.com",
    roleTitle: "Branch Office Intake & Files",
    badge: "Branch Office",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "RD",
  },
  {
    id: "suganya",
    name: "Suganya",
    email: "suganya@nunesinstruments.com",
    roleTitle: "Branch Office Intake & Files",
    badge: "Branch Office",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "SG",
  },
  {
    id: "senthil",
    name: "Senthil Kumar",
    email: "senthil@nunesinstruments.com",
    roleTitle: "Service Engineer (30%/50% Scope)",
    badge: "Workshop Repair",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "SK",
  },
  {
    id: "aravindh",
    name: "Aravindh",
    email: "aravindh@nunesinstruments.com",
    roleTitle: "Workshop Logistics & Branch Transport",
    badge: "Transport & Pickup",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "AR",
  },
  {
    id: "priya",
    name: "Azhalaku Priya",
    email: "azhalakupriya@nunesinstruments.com",
    roleTitle: "Commercial & Quotations Lead",
    badge: "Quotations",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "AP",
  },
  {
    id: "md",
    name: "Managing Director (MD)",
    email: "md@nunesinstruments.com",
    roleTitle: "Executive Operations Command",
    badge: "Full Access",
    badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    avatarBg: "bg-blue-600",
    initials: "MD",
  },
];

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
    // fallback if outside provider
  }

  const [commandOpen, setCommandOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return getPersistentSession()?.email || "";
  });
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Proactively eradicate any legacy collapsed flag to prevent stuck icon-only view
  useEffect(() => {
    try {
      localStorage.removeItem("nunes_sidebar_collapsed");
      localStorage.setItem("nunes_sidebar_collapsed", "false");
    } catch {}
  }, []);

  // Read current authenticated user session
  useEffect(() => {
    const syncUser = () => {
      try {
        const session = getPersistentSession();
        if (session?.email) setUserEmail(session.email);
      } catch {}
    };

    syncUser();
    window.addEventListener("nunes:records-synced", syncUser);
    window.addEventListener("nunes:auth-changed", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("nunes:records-synced", syncUser);
      window.removeEventListener("nunes:auth-changed", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, [pathname]);

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
  const isMd = Boolean(
    emailLower &&
      !emailLower.includes("admin") &&
      (emailLower === "md" ||
        emailLower.startsWith("md@") ||
        emailLower.includes("md@nunesinstruments.com") ||
        emailLower.includes("director") ||
        emailLower.includes("managing"))
  );

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
  const isWorkshopStaff = isAravindh || isSenthil;

  const isPriya = emailLower.includes("priya") || emailLower.includes("azhalaku");

  const isRadha = emailLower.includes("radha");
  const isSuganya = emailLower.includes("suganya");
  const isBranchStaff = isRadha || isSuganya;

  const isSabitha = emailLower.includes("sabitha");
  const isRekha = emailLower.includes("rekha");
  const isOnlineStaff = isSabitha || isRekha;

  const isIntakeStaff = isBranchStaff || isOnlineStaff;

  // Find active staff profile metadata
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
        ? "Service Engineer (30%/50% Scope)"
        : isAravindh
        ? "Workshop Logistics & Transport"
        : isPriya
        ? "Commercial & Quotations Lead"
        : isBranchStaff
        ? "Branch Office Intake & Files"
        : "Intake Specialist",
      badge: isAdminOrMd
        ? "Full Access"
        : isSenthil
        ? "Workshop"
        : isAravindh
        ? "Logistics"
        : isPriya
        ? "Commercial"
        : "Branch Office",
      badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      avatarBg: "bg-blue-600",
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

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
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

  const renderNavSectionHeading = (title: string) => (
    <div className="px-3 pt-3.5 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
      {title}
    </div>
  );

  const renderNavLink = (
    href: string,
    label: string,
    icon: React.ReactNode,
    badgeText?: string,
    badgeTone: "blue" | "purple" | "teal" | "amber" | "green" | "slate" = "slate"
  ) => {
    const isActive = pathname === href || (href !== "/dashboard" && href !== "/forms" && pathname.startsWith(href));
    
    const badgeBg = {
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      teal: "bg-teal-100 text-teal-700 border-teal-200",
      amber: "bg-amber-100 text-amber-800 border-amber-200",
      green: "bg-emerald-100 text-emerald-800 border-emerald-200",
      slate: "bg-slate-100 text-slate-700 border-slate-200",
    }[badgeTone];

    return (
      <Link
        href={href}
        prefetch={true}
        onClick={handleNavClick}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-150 select-none ${
          isActive
            ? "bg-blue-50/90 text-blue-900 font-bold border border-blue-200/80 shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        {/* Active Pill Indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-blue-600 rounded-r-md" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`transition-colors shrink-0 ${isActive ? "text-blue-600 font-bold" : "text-slate-500 group-hover:text-slate-700"}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {badgeText && (
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0 ${
              isActive ? "bg-blue-600 text-white border-blue-600" : badgeBg
            }`}
          >
            {badgeText}
          </span>
        )}
      </Link>
    );
  };

  // Full Sidebar Content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none font-sans bg-white dark:bg-[#080d1a] border-r border-slate-200/90 dark:border-slate-800/90 w-full transition-colors duration-150">
      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        {/* 1. BRAND HEADER */}
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/30">
                N
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap leading-tight">
                  NUNES INSTRUMENTS
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase truncate">
                    Coimbatore Portal
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button for Mobile Drawer */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close navigation"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 2. OPERATOR IDENTITY CARD (WITH 1-CLICK ROLE SWITCH) */}
        <div className="mt-2.5 p-2 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full ${currentStaff.avatarBg} text-white font-bold text-[11px] grid place-items-center shrink-0 shadow-2xs`}
              >
                {currentStaff.initials}
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 truncate">
                  {currentStaff.name}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {currentStaff.roleTitle}
                </span>
              </div>
            </div>

            {/* Quick Switch Button - STRICTLY MD & ADMIN ONLY */}
            {isAdminOrMd ? (
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                title="Switch active operator profile (Admin/MD Only)"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                <ArrowRightLeft size={12} />
                <span>Switch</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9.5px] font-extrabold border border-blue-200 dark:border-blue-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* 3. GLOBAL SEARCH BUTTON (CTRL+K) */}
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-slate-400 text-[11.5px] hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Quick search...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* 4. DEDICATED WORKSTATION NAVIGATION */}
        <div className="mt-3 flex flex-col gap-0.5">
          {/* ========================================================= */}
          {/* A. WORKSHOP STAFF: Senthil (Service) & Aravindh (Logistics) */}
          {/* ========================================================= */}
          {isWorkshopStaff ? (
            <>
              {renderNavSectionHeading(
                isSenthil ? "Service Engineer Station" : "Workshop Logistics Station"
              )}

              {renderNavLink(
                "/workshop",
                isSenthil ? "Workshop (30%/50% Scope)" : "Workshop & Pickup Queue",
                <Wrench size={16} />,
                isSenthil ? "Scope 30/50%" : "Logistics",
                isSenthil ? "purple" : "amber"
              )}

              {renderNavLink(
                "/products",
                "Equipment & Condition Photos",
                <Package size={16} />
              )}

              {renderNavLink(
                "/tasks",
                isSenthil ? "Assigned Repair Jobs" : "Transport & Delivery Tasks",
                <CheckSquare size={16} />
              )}

              {renderNavSectionHeading("Account & Security")}

              {renderNavLink(
                "/team",
                `My Profile (${currentStaff.name})`,
                <User size={16} />
              )}

              {renderNavLink(
                "/settings",
                "Settings & Password",
                <Settings size={16} />
              )}
            </>
          ) : isPriya ? (
            /* ========================================================= */
            /* B. COMMERCIAL & QUOTATIONS: Azhalaku Priya                */
            /* ========================================================= */
            <>
              {renderNavSectionHeading("Commercial Operations")}

              {renderNavLink(
                "/quotations",
                "Quotations & Delivery Final",
                <FileText size={16} />,
                "Action",
                "teal"
              )}

              {renderNavSectionHeading("Operational Files (Both)")}

              {renderNavLink(
                "/forms/servicing",
                "Customer Servicing",
                <FileText size={16} />,
                "Service",
                "blue"
              )}

              {renderNavLink(
                "/forms/purchasing",
                "Purchasing Orders",
                <ShoppingCart size={16} />,
                "Purchase",
                "teal"
              )}

              {renderNavLink(
                "/forms",
                "Forms & Files Hub",
                <FolderOpen size={16} />
              )}

              {renderNavSectionHeading("Customer Data")}

              {renderNavLink(
                "/customers",
                "Customer Accounts Directory",
                <Users size={16} />
              )}

              {renderNavLink(
                "/tasks",
                "Quotation Tasks & Queue",
                <CheckSquare size={16} />
              )}

              {renderNavSectionHeading("Account & Security")}

              {renderNavLink(
                "/team",
                "My Profile (Azhalaku Priya)",
                <User size={16} />
              )}

              {renderNavLink(
                "/settings",
                "Settings & Password",
                <Settings size={16} />
              )}
            </>
          ) : isIntakeStaff ? (
            /* ========================================================= */
            /* C. INTAKE STAFF: Radha, Suganya, Sabitha, Rekha           */
            /*    BOTH FILES: 1) Servicing File  2) Purchasing File     */
            /* ========================================================= */
            <>
              {renderNavSectionHeading(
                isBranchStaff ? "Branch Office Intake & Files" : "Online Desk Intake & Files"
              )}

              {/* FILE 1: CUSTOMER SERVICING FILE */}
              {renderNavLink(
                "/forms/servicing",
                "Customer Servicing",
                <FileText size={16} />,
                "Service",
                "blue"
              )}

              {/* FILE 2: PURCHASING ORDER FILE */}
              {renderNavLink(
                "/forms/purchasing",
                "Purchasing Orders",
                <ShoppingCart size={16} />,
                "Purchase",
                "teal"
              )}

              {/* ALL FORMS HUB */}
              {renderNavLink(
                "/forms",
                "Forms & Files Hub",
                <FolderOpen size={16} />
              )}

              {renderNavSectionHeading("Records & Tasks")}

              {renderNavLink(
                "/customers",
                "Customers Directory",
                <Users size={16} />
              )}

              {renderNavLink(
                "/products",
                "Received Products",
                <Package size={16} />,
                "Photos",
                "slate"
              )}

              {renderNavLink(
                "/tasks",
                "Daily Intake Tasks",
                <CheckSquare size={16} />
              )}

              {renderNavSectionHeading("Account & Security")}

              {renderNavLink(
                "/team",
                `My Profile (${currentStaff.name})`,
                <User size={16} />
              )}

              {renderNavLink(
                "/settings",
                "Settings & Password",
                <Settings size={16} />
              )}
            </>
          ) : (
            /* ========================================================= */
            /* D. EXECUTIVE / MD / ADMIN: Full Operations Command        */
            /* ========================================================= */
            <>
              {renderNavSectionHeading("Executive Command")}

              {renderNavLink(
                "/dashboard",
                "Operational Dashboard",
                <LayoutGrid size={16} />,
                "MD Gateway",
                "purple"
              )}

              {renderNavLink(
                "/reports",
                "Business Intelligence Reports",
                <BarChart3 size={16} />
              )}

              {renderNavSectionHeading("Operations Files & Pipeline")}

              {renderNavLink(
                "/workshop",
                "Workshop Pipeline (Scope 30/50%)",
                <Wrench size={16} />,
                "Live Pipeline",
                "purple"
              )}

              {/* FILE 1: SERVICING */}
              {renderNavLink(
                "/forms/servicing",
                "Customer Servicing",
                <FileText size={16} />,
                "Service",
                "blue"
              )}

              {/* FILE 2: PURCHASING */}
              {renderNavLink(
                "/forms/purchasing",
                "Purchasing Orders",
                <ShoppingCart size={16} />,
                "Purchase",
                "teal"
              )}

              {/* FORMS HUB */}
              {renderNavLink(
                "/forms",
                "Forms & Files Hub",
                <FolderOpen size={16} />
              )}

              {renderNavLink(
                "/quotations",
                "Commercial Quotations",
                <FileText size={16} />
              )}

              {renderNavLink(
                "/products",
                "Equipment & Photo Catalog",
                <Package size={16} />
              )}

              {renderNavLink(
                "/customers",
                "Customer Database",
                <Users size={16} />
              )}

              {renderNavLink(
                "/suppliers",
                "Suppliers & Vendors",
                <Building2 size={16} />
              )}

              {renderNavLink(
                "/tasks",
                "Team Tasks Hub",
                <CheckSquare size={16} />
              )}

              {renderNavSectionHeading("Administration")}

              {renderNavLink(
                "/team",
                "Staff Profiles & Role Governance",
                <Users size={16} />,
                "Admin",
                "slate"
              )}

              {renderNavLink(
                "/settings",
                "System Settings & Security",
                <Settings size={16} />
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. PINNED BOTTOM FOOTER (CLEAN USER PROFILE, THEME TOGGLE & LOGOUT) */}
      <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/60 space-y-2">
        {/* LIGHT & BLACK THEME TOGGLE IN SIDEBAR */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mode</span>
          <ThemeToggle variant="segmented" />
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <Link
            href="/team"
            onClick={handleNavClick}
            className="flex items-center gap-2 min-w-0 flex-1 no-underline group"
            title="View personal profile"
          >
            <div
              className={`w-7 h-7 rounded-full ${currentStaff.avatarBg} text-white font-bold text-[11px] grid place-items-center shrink-0 shadow-2xs`}
            >
              {currentStaff.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {currentStaff.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                {currentStaff.email}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              clearPersistentSession();
              window.location.href = "/login";
            }}
            title="Sign out of station"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between px-1.5 pt-1 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium select-none">
          <span>Nunes OS v4.2</span>
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Cloud Synced
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* COMMAND PALETTE (CTRL+K) */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

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
                        className={`w-8 h-8 rounded-full ${isSelected ? "bg-white/20" : staff.avatarBg} text-white font-bold text-xs grid place-items-center shrink-0`}
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
                        isSelected ? "bg-white/20 text-white border-white/20" : staff.badgeColor
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

      {/* MOBILE SLIDE-OVER DRAWER (FOR SCREENS < 768px) */}
      {openMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="relative w-80 max-w-[88vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* DESKTOP PERMANENTLY EXPANDED SIDEBAR (w-80 / 320px) */}
      <aside className="hidden md:flex w-80 h-screen flex-shrink-0 flex-col sticky top-0 z-20 shadow-xs">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
