"use client";

import CylindricalLoader from "@/components/CylindricalLoader";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  RotateCw,
  ShoppingCart,
  Wrench,
  Search,
  Plus,
  Sparkles,
  Layers,
  X,
  FileText,
  Eye,
} from "lucide-react";
import { clearDataCache, companyFetch, getModules, getOverview, getTasks, moduleUrl } from "@/lib/data";
import { syncPullFromCloud } from "@/lib/sync";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/lib/module-registry";
import AddOlderFormModal from "@/components/AddOlderFormModal";
import ServicingLottieAnimation from "@/components/ServicingLottieAnimation";

// =========================================================================
// 1. Bespoke Apple-Grade Interactive 3D Vector Instruments
// =========================================================================

function ServicingInstrumentSVG() {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-h-[195px] select-none"
      style={{ filter: "drop-shadow(0 16px 28px rgba(3, 27, 88, 0.45))" }}
    >
      <defs>
        <linearGradient id="chassisGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#031633" />
          <stop offset="100%" stopColor="#020e24" />
        </linearGradient>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <filter id="glowF" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Main Beveled Outer Chassis */}
      <rect
        x="24"
        y="26"
        width="272"
        height="168"
        rx="22"
        fill="url(#chassisGrad)"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.5"
      />

      {/* Recessed Inner Panel */}
      <rect
        x="34"
        y="36"
        width="252"
        height="148"
        rx="16"
        fill="rgba(2, 18, 48, 0.65)"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />

      {/* Laboratory Digital Oscilloscope Screen */}
      <rect
        x="46"
        y="48"
        width="166"
        height="100"
        rx="12"
        fill="url(#screenGrad)"
        stroke="rgba(56, 189, 248, 0.4)"
        strokeWidth="1.2"
      />

      {/* Reticle Grid Lines */}
      <path
        d="M 46 73 H 212 M 46 98 H 212 M 46 123 H 212 M 88 48 V 148 M 129 48 V 148 M 170 48 V 148"
        stroke="rgba(56, 189, 248, 0.16)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />

      {/* Calibration Waveform */}
      <path
        d="M 48 98 Q 62 60 76 98 T 104 98 Q 116 46 128 98 T 152 98 Q 166 138 180 98 T 210 98"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        filter="url(#glowF)"
      />

      {/* Screen Readout HUD */}
      <text x="54" y="65" fill="#38bdf8" fontSize="8" fontWeight="800" fontFamily="monospace">
        CH1: 1.000 kHz
      </text>
      <text x="142" y="65" fill="#34d399" fontSize="7.5" fontWeight="900" fontFamily="monospace">
        ● QC PASS
      </text>
      <text x="54" y="139" fill="rgba(255,255,255,0.7)" fontSize="7" fontWeight="700" fontFamily="monospace">
        5.00 Vp-p · CALIBRATED
      </text>

      {/* Metallic Rotary Dial 1 */}
      <circle cx="244" cy="72" r="18" fill="rgba(255, 255, 255, 0.16)" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.5" />
      <circle cx="244" cy="72" r="12" fill="rgba(4, 30, 75, 0.8)" />
      <line x1="244" y1="58" x2="244" y2="65" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <text x="244" y="96" fill="rgba(255,255,255,0.8)" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.4">
        CALIBRATE
      </text>

      {/* Metallic Rotary Dial 2 */}
      <circle cx="244" cy="126" r="15" fill="rgba(255, 255, 255, 0.16)" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.5" />
      <circle cx="244" cy="126" r="10" fill="rgba(4, 30, 75, 0.8)" />
      <line x1="244" y1="114" x2="244" y2="120" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <text x="244" y="148" fill="rgba(255,255,255,0.8)" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.4">
        RANGE
      </text>

      {/* Gold-Plated Diagnostic Test Terminals */}
      <circle cx="70" cy="164" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="70" cy="164" r="2.5" fill="#0f172a" />
      <text x="82" y="167" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="800">
        PROBE A
      </text>

      <circle cx="140" cy="164" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="140" cy="164" r="2.5" fill="#0f172a" />
      <text x="152" y="167" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="800">
        QC SENSOR
      </text>

      {/* Status LED Indicators */}
      <circle cx="270" cy="42" r="3" fill="#22c55e" filter="url(#glowF)" />
      <circle cx="258" cy="42" r="3" fill="#38bdf8" />
    </svg>
  );
}

function PurchasingInstrumentSVG() {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-h-[195px] select-none"
      style={{ filter: "drop-shadow(0 16px 28px rgba(3, 27, 88, 0.45))" }}
    >
      <defs>
        <linearGradient id="cartChassisGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="orderCardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#031d42" />
          <stop offset="100%" stopColor="#021128" />
        </linearGradient>
        <filter id="cartGlowF" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Main Glass Chassis */}
      <rect
        x="24"
        y="26"
        width="272"
        height="168"
        rx="22"
        fill="url(#cartChassisGrad)"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.5"
      />

      {/* Recessed Logistics Panel */}
      <rect
        x="34"
        y="36"
        width="252"
        height="148"
        rx="16"
        fill="rgba(2, 18, 48, 0.65)"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />

      {/* Digital Purchasing Ledger Screen */}
      <rect
        x="46"
        y="48"
        width="158"
        height="100"
        rx="12"
        fill="url(#orderCardGrad)"
        stroke="rgba(96, 165, 250, 0.4)"
        strokeWidth="1.2"
      />

      {/* PO Card Header */}
      <rect x="54" y="58" width="56" height="14" rx="4" fill="rgba(59, 130, 246, 0.3)" />
      <text x="60" y="68" fill="#93c5fd" fontSize="7.5" fontWeight="900" fontFamily="monospace">
        PO-VERIFIED
      </text>

      <text x="122" y="68" fill="#34d399" fontSize="7.5" fontWeight="950" fontFamily="monospace">
        ₹ LAKHS
      </text>

      {/* Order Item Rows */}
      <line x1="54" y1="80" x2="194" y2="80" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
      <text x="54" y="93" fill="#ffffff" fontSize="8" fontWeight="800">
        Lab Equipment &amp; Sensors
      </text>
      <text x="180" y="93" fill="#93c5fd" fontSize="7.5" fontWeight="700" textAnchor="end">
        Qty: 10
      </text>

      <line x1="54" y1="102" x2="194" y2="102" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
      <text x="54" y="115" fill="rgba(255, 255, 255, 0.85)" fontSize="8" fontWeight="700">
        Official Supplier Delivery
      </text>
      <text x="180" y="115" fill="#34d399" fontSize="7.5" fontWeight="800" textAnchor="end">
        ✓ Approved
      </text>

      {/* Barcode Strip */}
      <rect x="54" y="126" width="140" height="12" rx="3" fill="rgba(255, 255, 255, 0.08)" />
      <path
        d="M 60 128 V 136 M 64 128 V 136 M 66 128 V 136 M 70 128 V 136 M 74 128 V 136 M 78 128 V 136 M 82 128 V 136 M 88 128 V 136 M 92 128 V 136 M 96 128 V 136 M 102 128 V 136 M 106 128 V 136"
        stroke="rgba(255, 255, 255, 0.7)"
        strokeWidth="1.2"
      />
      <text x="120" y="135" fill="rgba(255,255,255,0.6)" fontSize="6" fontWeight="700" fontFamily="monospace">
        NM-ORDER-2026
      </text>

      {/* Isometric 3D Procurement Cube */}
      <g transform="translate(216, 56)">
        <path d="M 32 6 L 62 20 L 32 34 L 2 20 Z" fill="#60a5fa" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <path d="M 2 20 L 32 34 L 32 74 L 2 60 Z" fill="#2563eb" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path d="M 32 34 L 62 20 L 62 60 L 32 74 Z" fill="#1d4ed8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path d="M 24 20 L 40 28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="52" r="5" fill="#38bdf8" filter="url(#cartGlowF)" />
      </g>

      {/* Cargo Logistics Route */}
      <path
        d="M 54 164 H 266"
        stroke="rgba(96, 165, 250, 0.4)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <circle cx="54" cy="164" r="3.5" fill="#38bdf8" />
      <circle cx="160" cy="164" r="3.5" fill="#60a5fa" />
      <circle cx="266" cy="164" r="3.5" fill="#22c55e" filter="url(#cartGlowF)" />
      <text x="54" y="177" fill="rgba(255,255,255,0.7)" fontSize="6.5" fontWeight="700">
        DISPATCH
      </text>
      <text x="160" y="177" fill="rgba(255,255,255,0.7)" fontSize="6.5" fontWeight="700" textAnchor="middle">
        PAYMENT
      </text>
      <text x="266" y="177" fill="#34d399" fontSize="6.5" fontWeight="800" textAnchor="end">
        COMPLETE
      </text>
    </svg>
  );
}

// =========================================================================
// 2. ProcessHero 3D Card Banners
// =========================================================================

function PurchasingHero3D({ isReady }: { isReady: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (rafRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: -(y * 8), y: x * 8 });
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link
      href="/forms/purchasing"
      className="process-hero purchasing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Click to Open Purchasing Form"
      style={{ textDecoration: "none", cursor: "pointer" }}
    >
      <div className="hero-mesh-glow blue" />

      <div className="hero-content-left">
        <div className="hero-kicker-pill">
          <ShoppingCart size={12} />
          <span>PROCUREMENT WORKFLOW</span>
        </div>
        <h2 className="hero-title">PURCHASING</h2>
        <p className="hero-subtitle">Order Management &amp; Direct Quotation PDF</p>
        <div className="hero-status-badge">
          <span className={`status-pulse-dot ${isReady ? "ready" : "offline"}`} />
          <span>{isReady ? "Live Operational • 6 Stages" : "Ready"}</span>
        </div>
      </div>

      <div className="hero-scene-right">
        <div
          className="hero-3d-stage"
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <div className="hero-3d-shadow" />
          <div className="hero-3d-device-floater">
            <PurchasingInstrumentSVG />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ServicingHero3D({ isReady }: { isReady: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (rafRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: -(y * 8), y: x * 8 });
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link
      href="/forms/servicing"
      className="process-hero servicing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Click to Open Servicing Form"
      style={{ textDecoration: "none", cursor: "pointer" }}
    >
      <div className="hero-mesh-glow blue" />

      <div className="hero-content-left">
        <div className="hero-kicker-pill">
          <Wrench size={12} />
          <span>DIAGNOSTICS &amp; LAB</span>
        </div>
        <h2 className="hero-title">SERVICING</h2>
        <p className="hero-subtitle">Calibration, Quality Control &amp; Job Cards</p>
        <div className="hero-status-badge">
          <span className={`status-pulse-dot ${isReady ? "ready" : "offline"}`} />
          <span>{isReady ? "Live Diagnostic Engine • 8 Stages" : "Ready"}</span>
        </div>
      </div>

      <div className="hero-scene-right">
        <div
          className="hero-3d-stage"
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <div className="hero-3d-shadow" />
          <div className="hero-3d-device-floater">
            <ServicingLottieAnimation />
          </div>
        </div>
      </div>
    </Link>
  );
}

export interface MetricsData {
  active: number;
  waiting: number;
  attention: number;
  completed: number;
}

export function ProcessMetrics({ metrics }: { metrics: MetricsData }) {
  return (
    <div className="process-metrics-grid" role="region" aria-label="Operational Metrics">
      <div className="metric-tile active">
        <div className="metric-icon blue">
          <ClipboardList size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.active}</strong>
          <span>Active</span>
        </div>
      </div>

      <div className="metric-tile waiting">
        <div className="metric-icon blue">
          <Clock3 size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.waiting}</strong>
          <span>Waiting</span>
        </div>
      </div>

      <div className="metric-tile attention">
        <div className="metric-icon blue">
          <AlertTriangle size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.attention}</strong>
          <span>Attention</span>
        </div>
      </div>

      <div className="metric-tile completed">
        <div className="metric-icon blue">
          <CheckCircle2 size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.completed}</strong>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

export function WorkflowStages({ stages }: { stages: string[] }) {
  return (
    <div className="workflow-stages-wrap" role="list" aria-label="Workflow Stages">
      {stages.map((stage, idx) => (
        <span key={stage} className="workflow-stage-chip" role="listitem">
          <small>{idx + 1}</small>
          <b>{stage}</b>
        </span>
      ))}
    </div>
  );
}

interface ProcessCardProps {
  moduleDef: ModuleDefinition;
  isReady: boolean;
  metrics: MetricsData;
  onAddOlder?: () => void;
}

export function ProcessCard({ moduleDef, isReady, metrics, onAddOlder }: ProcessCardProps) {
  return (
    <article className={`process-card ${moduleDef.id}`} id={`process-card-${moduleDef.id}`}>
      <ServicingHero3D isReady={isReady} />
      <div className="process-card-content">
        <ProcessMetrics metrics={metrics} />
        <WorkflowStages stages={moduleDef.workflow} />
        <div className="process-actions-row">
          <Link
            href={moduleDef.route}
            className={`process-action-btn primary ${moduleDef.id}`}
            title={`Open ${moduleDef.name} Form`}
          >
            <ExternalLink size={16} />
            <span>Open {moduleDef.name} Form</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href={moduleDef.id === "servicing" ? "/workshop" : `/tasks?source=${moduleDef.id}`}
            className="process-action-btn secondary"
          >
            <Clock3 size={16} />
            <span>{moduleDef.id === "servicing" ? "Workshop Queue" : "Work Queue"}</span>
          </Link>
          <Link href={`/reports?source=${moduleDef.id}`} className="process-action-btn secondary">
            <BarChart2 size={16} />
            <span>Reports</span>
          </Link>
          {moduleDef.id === "servicing" && onAddOlder && (
            <button
              type="button"
              onClick={onAddOlder}
              className="process-action-btn secondary"
              title="Add a past or legacy job with manual prices and attachments"
            >
              <Plus size={15} />
              <span>Add Older Job</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// =========================================================================
// 3. ProcessSelection (Main Page View)
// =========================================================================

export default function ProcessSelection() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [tasks, setTasks] = useState<any>(null);
  const [modules, setModules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddOlderModal, setShowAddOlderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOlderFormSuccess = () => {
    setLoading(true);
    void loadData();
  };

  // Role Redirection Guard
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) {
        const email = (JSON.parse(raw)?.email || "").toLowerCase().trim();
        const isMdUser = Boolean(
          email &&
            !email.includes("admin") &&
            (email === "md" ||
              email.startsWith("md@") ||
              email.includes("md@nunesinstruments.com") ||
              email.includes("director") ||
              email.includes("managing"))
        );
        if (isMdUser) {
          router.replace("/dashboard");
          return;
        }

        if (
          email &&
          !email.includes("admin") &&
          !email.includes("md") &&
          !email.startsWith("md@") &&
          !email.startsWith("admin@") &&
          !email.includes("director")
        ) {
          if (email.includes("aravind") || email.includes("senthil")) {
            router.replace("/workshop");
            return;
          }
          if (email.includes("priya") || email.includes("azhalaku")) {
            router.replace("/quotations");
            return;
          }
        }
      }
    } catch {}
  }, [router]);

  const loadData = async () => {
    try {
      setError(null);
      await syncPullFromCloud().catch(() => {});
      clearDataCache("/api/data/modules");
      const [m, o, t] = await Promise.all([
        getModules().catch(() => ({})),
        getOverview().catch(() => null),
        getTasks().catch(() => null),
      ]);
      setModules(m || {});
      setOverview(o);
      setTasks(t);
    } catch (err: any) {
      setError(err?.message || "Failed to load operational systems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live statistics dynamically from actual records (localStorage + live API)
  const purchasingMetrics: MetricsData = useMemo(() => {
    try {
      const pRaw = typeof window !== "undefined" ? localStorage.getItem("nunes:purchasing_orders") : null;
      const pStorage: any[] = pRaw ? JSON.parse(pRaw) : [];
      const pTasks: any[] = tasks?.purchasing || [];

      const combined = [
        ...pStorage,
        ...pTasks.filter((t) => !pStorage.some((s) => s.order_id === t.record_no || s.id === t.id)),
      ];

      const active = combined.filter((x) => {
        const st = String(x.current_status || x.status || "").toLowerCase();
        return st !== "completed" && st !== "cancelled";
      }).length;

      const waiting = combined.filter((x) => {
        const hours = Number(x.waiting_hours || 0);
        const st = String(x.current_status || x.status || "").toLowerCase();
        return hours >= 2 || st.includes("approval") || st.includes("waiting");
      }).length;

      const attention = combined.filter((x) => Boolean(x.needs_attention)).length;

      const completed =
        (overview?.forms?.completed_orders || 0) +
        combined.filter((x) => {
          const st = String(x.current_status || x.status || "").toLowerCase();
          return st === "completed";
        }).length;

      return { active, waiting, attention, completed };
    } catch {
      return { active: 0, waiting: 0, attention: 0, completed: 0 };
    }
  }, [tasks, overview]);

  const servicingMetrics: MetricsData = useMemo(() => {
    try {
      const sRaw = typeof window !== "undefined" ? localStorage.getItem("nunes:service_jobs") : null;
      const sStorage: any[] = sRaw ? JSON.parse(sRaw) : [];
      const sTasks: any[] = tasks?.servicing || [];

      const combined = [
        ...sStorage,
        ...sTasks.filter((t) => !sStorage.some((s) => s.jobNo === t.record_no || s.id === t.id)),
      ];

      const active = combined.filter((x) => {
        const st = String(x.status || "").toUpperCase();
        return st !== "COMPLETED" && st !== "CANCELLED" && st !== "DELIVERED";
      }).length;

      const waiting = combined.filter((x) => {
        const hours = Number(x.waiting_hours || 0);
        const st = String(x.status || "").toUpperCase();
        return hours >= 2 || st.includes("ESTIMATE") || st.includes("APPROVAL");
      }).length;

      const attention = combined.filter((x) => Boolean(x.needs_attention)).length;

      const completed =
        (overview?.service?.completed_jobs || 0) +
        combined.filter((x) => {
          const st = String(x.status || "").toUpperCase();
          return st === "COMPLETED" || st === "DELIVERED";
        }).length;

      return { active, waiting, attention, completed };
    } catch {
      return { active: 0, waiting: 0, attention: 0, completed: 0 };
    }
  }, [tasks, overview]);

  // Read all records for search & live recent queue
  const allServiceJobs = useMemo<any[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("nunes:service_jobs");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [loading]);

  const allPurchasingOrders = useMemo<any[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("nunes:purchasing_orders");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [loading]);

  // Instant Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matchedJobs = allServiceJobs
      .filter((j) => {
        const jobNo = String(j.jobNo || j.id || "").toLowerCase();
        const cust = String(j.customer?.name || "").toLowerCase();
        const prod = String(j.products?.[0]?.productName || j.products?.[0]?.makeModel || "").toLowerCase();
        return jobNo.includes(q) || cust.includes(q) || prod.includes(q);
      })
      .map((j) => ({
        type: "servicing" as const,
        id: String(j.jobNo || j.id),
        title: `Job #${j.jobNo || j.id}`,
        subtitle: j.products?.[0]?.productName || j.products?.[0]?.makeModel || "Equipment",
        customer: j.customer?.name || "Customer",
        status: String(j.workflow?.stage || j.status || "RECEIVED").replace(/_/g, " "),
        link: `/forms/servicing?id=${j.id || j.jobNo}`,
      }));

    const matchedOrders = allPurchasingOrders
      .filter((o) => {
        const orderId = String(o.order_id || o.id || "").toLowerCase();
        const cust = String(o.customer_name || "").toLowerCase();
        return orderId.includes(q) || cust.includes(q);
      })
      .map((o) => ({
        type: "purchasing" as const,
        id: String(o.order_id || o.id),
        title: `Order #${o.order_id || o.id}`,
        subtitle: `${(o.marketing_items || []).length} items`,
        customer: o.customer_name || "Customer",
        status: String(o.current_status || o.status || "In Progress").replace(/_/g, " "),
        link: `/forms/purchasing?id=${o.id || o.order_id}`,
      }));

    return matchedJobs.slice(0, 8);
  }, [searchQuery, allServiceJobs]);



  const purchasingDef = MODULE_REGISTRY.find((x) => x.id === "purchasing");
  const servicingDef = MODULE_REGISTRY.find((x) => x.id === "servicing");

  if (loading) {
    return (
      <main className="forms-hub-page">
        <CylindricalLoader text="LOADING FORMS HUB" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="forms-hub-page">
        <div className="process-error-state">
          <AlertTriangle size={40} />
          <h3>Operational Data Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadData} className="btn primary">
            <RotateCw size={15} />
            <span>Retry Connection</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="forms-hub-page" style={{ maxWidth: "1360px", margin: "0 auto", padding: "24px 20px" }}>
      {/* 1. TOP IDENTITY & FAST SEARCH HEADER */}
      <div style={{ maxWidth: "920px", margin: "0 auto 24px auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#0866ff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            CENTRAL OPERATIONS HUB
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: "4px 0", letterSpacing: "-0.5px" }}>
            Forms Hub
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            Intake, diagnostics, technician scopes, quality control cards, and purchasing orders.
          </p>
        </div>

        {/* Search Bar & Direct Quick Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "290px" }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
            <input
              type="text"
              placeholder="Search Job #, Customer, Serial No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 32px 8px 34px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "12.5px",
                background: "#ffffff",
                color: "#0f172a",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={14} color="#94a3b8" />
              </button>
            )}

            {/* Instant Floating Search Results */}
            {searchQuery && (
              <div
                style={{
                  position: "absolute",
                  top: "42px",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
                  zIndex: 50,
                  maxHeight: "340px",
                  overflowY: "auto",
                  padding: "6px",
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: "14px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                    No matching records found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => setSearchQuery("")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "#0f172a",
                        transition: "background 0.15s ease",
                      }}
                      className="hover:bg-blue-50"
                    >
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 800 }}>{item.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {item.customer} · {item.subtitle}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: item.type === "servicing" ? "#dcfce7" : "#dbeafe",
                          color: item.type === "servicing" ? "#166534" : "#1e40af",
                        }}
                      >
                        {item.status}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddOlderModal(true)}
            style={{
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#334155",
              fontSize: "12.5px",
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Plus size={15} color="#0866ff" />
            <span>Add Historical Job</span>
          </button>
        </div>
      </div>

      {/* 2. SERVICING FORM (PROMINENT CENTERED OPERATION CARD) */}
      <div className="hub-forms-grid" style={{ maxWidth: "920px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr" }}>
        {servicingDef && (
          <ProcessCard
            moduleDef={servicingDef}
            isReady={true}
            metrics={servicingMetrics}
            onAddOlder={() => setShowAddOlderModal(true)}
          />
        )}
      </div>

      {/* 4. MODAL: ADD HISTORICAL / OLDER FORM */}
      <AddOlderFormModal
        isOpen={showAddOlderModal}
        onClose={() => setShowAddOlderModal(false)}
        onSuccess={handleOlderFormSuccess}
      />
    </main>
  );
}
