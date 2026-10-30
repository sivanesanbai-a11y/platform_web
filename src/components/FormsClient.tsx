"use client";
import CylindricalLoader from '@/components/CylindricalLoader';
import React, { useEffect, useState, useMemo } from "react";
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
  Wrench
} from "lucide-react";
import { clearDataCache, companyFetch, getModules, getOverview, getTasks, moduleUrl } from "@/lib/data";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/lib/module-registry";
import CartLottieAnimation from "@/components/CartLottieAnimation";
import ServicingLottieAnimation from "@/components/ServicingLottieAnimation";
import AddOlderFormModal from "@/components/AddOlderFormModal";

// =========================================================================
// 1. ProcessHero 3D Animated Components
// =========================================================================

function PurchasingHero3D({ isReady }: { isReady: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 14), y: x * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link
      href="/forms/purchasing"
      className="process-hero purchasing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Click to Open Purchasing Form"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
    >
      {/* Background Animated Glow */}
      <div className="hero-mesh-glow blue" />

      {/* Left Content / Typography */}
      <div className="hero-content-left">
        <div className="hero-kicker-pill">
          <ShoppingCart size={12} />
          <span>PROCUREMENT WORKFLOW</span>
        </div>
        <h2 className="hero-title">PURCHASING</h2>
        <p className="hero-subtitle">Order Management &amp; Direct Quotation PDF</p>
        <div className="hero-status-badge">
          <span className={`status-pulse-dot ${isReady ? "ready" : "offline"}`} />
          <span>{isReady ? "Live System Operational • 4 Stages" : "Starting up in background..."}</span>
        </div>
        <div style={{ marginTop: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.25)',
            padding: '3px 10px',
            borderRadius: '999px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            Open Purchasing Form <ArrowRight size={12} />
          </span>
        </div>
      </div>

      {/* Right 3D Moving Animated Scene - Only Cart Moves */}
      <div className="hero-scene-right">
        <div
          className="hero-3d-stage"
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {/* Ground Contact Shadow */}
          <div className="hero-3d-shadow" />

          {/* Floating 3D Core Cart - Running Lottie JSON Animation */}
          <div className="hero-3d-cart-floater">
            <CartLottieAnimation />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ServicingHero3D({ isReady }: { isReady: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 14), y: x * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link
      href="/forms/servicing"
      className="process-hero servicing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Click to Open Servicing Form"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
    >
      {/* Background Animated Glow */}
      <div className="hero-mesh-glow blue" />

      {/* Left Content / Typography */}
      <div className="hero-content-left">
        <div className="hero-kicker-pill">
          <Wrench size={12} />
          <span>DIAGNOSTICS &amp; LAB</span>
        </div>
        <h2 className="hero-title">SERVICING</h2>
        <p className="hero-subtitle">Calibration, Quality Control &amp; Job Cards</p>
        <div className="hero-status-badge">
          <span className={`status-pulse-dot ${isReady ? "ready" : "offline"}`} />
          <span>{isReady ? "Live Diagnostic Engine • 4 Stages" : "Starting up in background..."}</span>
        </div>
        <div style={{ marginTop: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.25)',
            padding: '3px 10px',
            borderRadius: '999px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            Open Servicing Form <ArrowRight size={12} />
          </span>
        </div>
      </div>

      {/* Right 3D Moving Animated Scene - Only Servicing Equipment Moves */}
      <div className="hero-scene-right">
        <div
          className="hero-3d-stage"
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {/* Ground Contact Shadow */}
          <div className="hero-3d-shadow" />

          {/* Floating 3D Core Device - Running Lottie JSON Animation */}
          <div className="hero-3d-device-floater">
            <ServicingLottieAnimation />
          </div>
        </div>
      </div>
    </Link>
  );
}

interface ProcessHeroProps {
  id: "purchasing" | "servicing";
  name: string;
  isReady: boolean;
  bannerImg?: string;
}

export function ProcessHero({ id, name, isReady }: ProcessHeroProps) {
  if (id === "purchasing") {
    return <PurchasingHero3D isReady={isReady} />;
  }
  return <ServicingHero3D isReady={isReady} />;
}

// =========================================================================
// 2. ProcessMetrics Component
// =========================================================================
export interface MetricsData {
  active: number;
  waiting: number;
  attention: number;
  completed: number;
}

interface ProcessMetricsProps {
  metrics: MetricsData;
}

export function ProcessMetrics({ metrics }: ProcessMetricsProps) {
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

// =========================================================================
// 3. WorkflowStages Component
// =========================================================================
interface WorkflowStagesProps {
  stages: string[];
}

export function WorkflowStages({ stages }: WorkflowStagesProps) {
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

// =========================================================================
// 4. ProcessActions Component
// =========================================================================
interface ProcessActionsProps {
  id: "purchasing" | "servicing";
  name: string;
  route: string;
}

export function ProcessActions({ id, name, route }: ProcessActionsProps) {
  return (
    <div className="process-actions-row">
      <Link href={route} className={`process-action-btn primary ${id}`} title={`Open ${name} Form immediately`}>
        <ExternalLink size={16} />
        <span>Open {name} Form</span>
        <ArrowRight size={16} />
      </Link>
      <Link href={`/tasks?source=${id}`} className="process-action-btn secondary">
        <Clock3 size={16} />
        <span>Work Queue</span>
      </Link>
      <Link href={`/reports?source=${id}`} className="process-action-btn secondary">
        <BarChart2 size={16} />
        <span>Reports</span>
      </Link>
    </div>
  );
}

// =========================================================================
// 5. ProcessCard Component
// =========================================================================
interface ProcessCardProps {
  moduleDef: ModuleDefinition;
  isReady: boolean;
  metrics: MetricsData;
}

export function ProcessCard({ moduleDef, isReady, metrics }: ProcessCardProps) {
  const bannerImg =
    moduleDef.id === "servicing"
      ? "/images/servicing_banner.png"
      : "/images/purchasing_banner.png";

  return (
    <article className={`process-card ${moduleDef.id}`} id={`process-card-${moduleDef.id}`}>
      <ProcessHero
        id={moduleDef.id}
        name={moduleDef.name}
        isReady={isReady}
        bannerImg={bannerImg}
      />
      <div className="process-card-content">
        <ProcessMetrics metrics={metrics} />
        <WorkflowStages stages={moduleDef.workflow} />
        <ProcessActions
          id={moduleDef.id}
          name={moduleDef.name}
          route={moduleDef.route}
        />
      </div>
    </article>
  );
}

// =========================================================================
// 6. LoadingSkeleton Component
// =========================================================================
export function LoadingSkeleton() {
  return <CylindricalLoader text="LOADING" />;
}

// =========================================================================
// 7. EmptyState Component
// =========================================================================
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="process-empty-state">
      <ClipboardList size={40} />
      <h3>No modules configured</h3>
      <p>{message}</p>
    </div>
  );
}

// =========================================================================
// 8. ErrorState Component
// =========================================================================
export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="process-error-state">
      <AlertTriangle size={40} />
      <h3>Operational Data Unavailable</h3>
      <p>{error}</p>
      <button onClick={onRetry} className="btn primary">
        <RotateCw size={15} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}

// =========================================================================
// 9. ProcessSelection (Main Page View)
// =========================================================================
export default function ProcessSelection() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [tasks, setTasks] = useState<any>(null);
  const [modules, setModules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddOlderModal, setShowAddOlderModal] = useState(false);

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
      clearDataCache("/api/data/modules");
      const [m, o, t] = await Promise.all([
        getModules().catch(() => ({})),
        getOverview().catch(() => null),
        getTasks().catch(() => null)
      ]);
      setModules(m || {});
      setOverview(o);
      setTasks(t);
      for (const k of ["service_operations", "order_forms"]) {
        const x = (m as any)?.[k];
        if (x?.ready || x?.public_url) {
          const u = moduleUrl(x);
          if (u) sessionStorage.setItem(`nunes:module-url:${k}`, u);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load operational systems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const refreshModules = async () => {
      try {
        clearDataCache("/api/data/modules");
        const m = await getModules();
        if (!alive) return;
        setModules(m);
        for (const k of ["service_operations", "order_forms"]) {
          const x = m?.[k];
          if (x?.ready || x?.public_url) {
            const u = moduleUrl(x);
            if (u) sessionStorage.setItem(`nunes:module-url:${k}`, u);
          }
        }
        const allReady = Boolean(m?.service_operations?.ready && m?.order_forms?.ready);
        if (!allReady) timer = window.setTimeout(refreshModules, 1000);
      } catch {
        if (alive) timer = window.setTimeout(refreshModules, 2000);
      }
    };

    companyFetch("/api/data/modules/service_operations/start", { method: "POST", cache: "no-store" }).catch(() => {});
    const purchaseWarm = window.setTimeout(
      () => companyFetch("/api/data/modules/order_forms/start", { method: "POST", cache: "no-store" }).catch(() => {}),
      4000
    );

    loadData();
    refreshModules();

    const visible = () => {
      if (document.visibilityState === "visible") refreshModules();
    };
    document.addEventListener("visibilitychange", visible);

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
      window.clearTimeout(purchaseWarm);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  // Compute live statistics dynamically from actual records (localStorage + live API)
  const purchasingMetrics: MetricsData = useMemo(() => {
    try {
      const pRaw = typeof window !== "undefined" ? localStorage.getItem("nunes:purchasing_orders") : null;
      const pStorage: any[] = pRaw ? JSON.parse(pRaw) : [];
      const pTasks: any[] = tasks?.purchasing || [];

      // Combine unique active records
      const combined = [
        ...pStorage,
        ...pTasks.filter((t) => !pStorage.some((s) => s.order_id === t.record_no || s.id === t.id))
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

      return {
        active,
        waiting,
        attention,
        completed
      };
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
        ...sTasks.filter((t) => !sStorage.some((s) => s.jobNo === t.record_no || s.id === t.id))
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

      return {
        active,
        waiting,
        attention,
        completed
      };
    } catch {
      return { active: 0, waiting: 0, attention: 0, completed: 0 };
    }
  }, [tasks, overview]);

  const purchasingDef = MODULE_REGISTRY.find((x) => x.id === "purchasing");
  const servicingDef = MODULE_REGISTRY.find((x) => x.id === "servicing");

  if (loading) {
    return (
      <main className="forms-hub-page">
        <LoadingSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="forms-hub-page">
        <ErrorState error={error} onRetry={loadData} />
      </main>
    );
  }

  if (!purchasingDef || !servicingDef) {
    return (
      <main className="forms-hub-page">
        <EmptyState message="Purchasing and Servicing module definitions are not registered." />
      </main>
    );
  }

  const isPurchasingReady = Boolean(modules?.order_forms?.ready || modules?.order_forms?.public_url);
  const isServicingReady = Boolean(modules?.service_operations?.ready || modules?.service_operations?.public_url);

  return (
    <main className="forms-hub-page">
      <div className="hub-forms-grid">
        <ProcessCard
          moduleDef={purchasingDef}
          isReady={isPurchasingReady}
          metrics={purchasingMetrics}
        />
        <ProcessCard
          moduleDef={servicingDef}
          isReady={isServicingReady}
          metrics={servicingMetrics}
        />
      </div>

      {/* Modal: Add Older Form Record with Manual Price & File Attachments */}
      <AddOlderFormModal
        isOpen={showAddOlderModal}
        onClose={() => setShowAddOlderModal(false)}
        onSuccess={handleOlderFormSuccess}
      />
    </main>
  );
}
