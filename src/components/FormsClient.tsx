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
  Wrench,
  Plus
} from "lucide-react";
import { clearDataCache, companyFetch, getModules, getOverview, getTasks, moduleUrl } from "@/lib/data";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/lib/module-registry";
import ServicingLottieAnimation from "@/components/ServicingLottieAnimation";
import AddOlderFormModal from "@/components/AddOlderFormModal";

// =========================================================================
// 1. Servicing Hero 3D Animated Component
// =========================================================================

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
        <h2 className="hero-title">SERVICING WORKSTATION</h2>
        <p className="hero-subtitle">Calibration, Quality Control, Diagnostics &amp; Job Cards</p>
        <div className="hero-status-badge">
          <span className={`status-pulse-dot ${isReady ? "ready" : "offline"}`} />
          <span>{isReady ? "Live Diagnostic Engine • Operational" : "Starting up in background..."}</span>
        </div>
        <div style={{ marginTop: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.25)',
            padding: '5px 14px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}>
            Open Servicing Form <ArrowRight size={14} />
          </span>
        </div>
      </div>

      {/* Right 3D Moving Animated Scene */}
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

export function ProcessHero({ id, name, isReady }: { id: string; name: string; isReady: boolean }) {
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
          <span>Active Repairs</span>
        </div>
      </div>

      <div className="metric-tile waiting">
        <div className="metric-icon blue">
          <Clock3 size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.waiting}</strong>
          <span>Estimate / Approval</span>
        </div>
      </div>

      <div className="metric-tile attention">
        <div className="metric-icon blue">
          <AlertTriangle size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.attention}</strong>
          <span>Attention Needed</span>
        </div>
      </div>

      <div className="metric-tile completed">
        <div className="metric-icon blue">
          <CheckCircle2 size={18} />
        </div>
        <div className="metric-data">
          <strong>{metrics.completed}</strong>
          <span>Delivered / Closed</span>
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
  id: string;
  name: string;
  route: string;
  onAddOlder?: () => void;
}

export function ProcessActions({ id, name, route, onAddOlder }: ProcessActionsProps) {
  return (
    <div className="process-actions-row">
      <Link href={route} className="process-action-btn primary servicing" title="Open Servicing Form immediately">
        <ExternalLink size={16} />
        <span>Open Servicing Form</span>
        <ArrowRight size={16} />
      </Link>
      <Link href="/tasks?source=servicing" className="process-action-btn secondary">
        <Clock3 size={16} />
        <span>Work Queue</span>
      </Link>
      <Link href="/reports?source=servicing" className="process-action-btn secondary">
        <BarChart2 size={16} />
        <span>Reports</span>
      </Link>
      {onAddOlder && (
        <button
          type="button"
          onClick={onAddOlder}
          className="process-action-btn secondary"
          style={{ cursor: "pointer", border: "1px dashed var(--brand)", color: "var(--brand)" }}
        >
          <Plus size={16} />
          <span>Add Historical Job</span>
        </button>
      )}
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
  onAddOlder?: () => void;
}

export function ProcessCard({ moduleDef, isReady, metrics, onAddOlder }: ProcessCardProps) {
  return (
    <article className="process-card servicing" id={`process-card-${moduleDef.id}`}>
      <ProcessHero
        id={moduleDef.id}
        name={moduleDef.name}
        isReady={isReady}
      />
      <div className="process-card-content">
        <ProcessMetrics metrics={metrics} />
        <WorkflowStages stages={moduleDef.workflow} />
        <ProcessActions
          id={moduleDef.id}
          name={moduleDef.name}
          route={moduleDef.route}
          onAddOlder={onAddOlder}
        />
      </div>
    </article>
  );
}

// =========================================================================
// 6. LoadingSkeleton Component
// =========================================================================
export function LoadingSkeleton() {
  return <CylindricalLoader text="LOADING SERVICING HUB" />;
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
// 9. FormsClient (Main Page View - Servicing Only)
// =========================================================================
export default function FormsClient() {
  const router = useRouter();
  const [modules, setModules] = useState<any>({});
  const [overview, setOverview] = useState<any>(null);
  const [tasks, setTasks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddOlderModal, setShowAddOlderModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, o, t] = await Promise.all([
        getModules().catch(() => ({})),
        getOverview().catch(() => null),
        getTasks().catch(() => null)
      ]);
      setModules(m || {});
      setOverview(o);
      setTasks(t);
      const x = (m as any)?.service_operations;
      if (x?.ready || x?.public_url) {
        const u = moduleUrl(x);
        if (u) sessionStorage.setItem("nunes:module-url:service_operations", u);
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
        const x = m?.service_operations;
        if (x?.ready || x?.public_url) {
          const u = moduleUrl(x);
          if (u) sessionStorage.setItem("nunes:module-url:service_operations", u);
        }
        if (!m?.service_operations?.ready) {
          timer = window.setTimeout(refreshModules, 1000);
        }
      } catch {
        if (alive) timer = window.setTimeout(refreshModules, 2000);
      }
    };

    companyFetch("/api/data/modules/service_operations/start", { method: "POST", cache: "no-store" }).catch(() => {});

    loadData();
    refreshModules();

    const visible = () => {
      if (document.visibilityState === "visible") refreshModules();
    };
    document.addEventListener("visibilitychange", visible);

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  // Compute live statistics dynamically from actual records (localStorage + live API)
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

  const handleOlderFormSuccess = () => {
    loadData();
  };

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

  if (!servicingDef) {
    return (
      <main className="forms-hub-page">
        <EmptyState message="Servicing module definition is not registered." />
      </main>
    );
  }

  const isServicingReady = Boolean(modules?.service_operations?.ready || modules?.service_operations?.public_url);

  return (
    <main className="forms-hub-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="section-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OPERATIONS FORM WORKSTATION</span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)', margin: '4px 0' }}>Servicing Operations Hub</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Intake, diagnostics, technician scope, quotation approval &amp; customer delivery.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddOlderModal(true)}
          className="btn"
          style={{
            background: '#ffffff',
            border: '1px solid var(--line)',
            color: 'var(--text)',
            fontSize: '12px',
            fontWeight: 700,
            padding: '9px 16px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <ClipboardList size={15} style={{ color: 'var(--brand)' }} />
          <span>+ Add Historical / Missing Service Job</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <ProcessCard
          moduleDef={servicingDef}
          isReady={isServicingReady}
          metrics={servicingMetrics}
          onAddOlder={() => setShowAddOlderModal(true)}
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
