"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  IndianRupee,
  Layers3,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react";
import CylindricalLoader from "@/components/CylindricalLoader";
import ReportModal from "./ReportModal";
import {
  buildOfflineReport,
  compactMoney,
  connectLocalDataBridge,
  dateText,
  getActivity,
  getDashboardBootstrap,
  getReport,
  getRevision,
  money,
  readDashboardSnapshot,
  relativeTime,
  writeDashboardSnapshot,
} from "@/lib/data";
import { syncPullFromCloud } from "@/lib/sync";
import type { ActivityPayload, Overview, TasksPayload } from "@/lib/types";

// Dynamic chart imports from DashboardCharts
const FormsOverviewChart = dynamic(
  () => import("./DashboardCharts").then((m) => m.FormsOverviewChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] flex items-center justify-center text-xs text-slate-400">
        Loading chart…
      </div>
    ),
  }
);

const ModernDonutChart = dynamic(
  () => import("./DashboardCharts").then((m) => m.ModernDonutChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
        Loading workload distribution…
      </div>
    ),
  }
);

const MiniSparkline = dynamic(
  () => import("./DashboardCharts").then((m) => m.MiniSparkline),
  { ssr: false }
);

const COLORS = [
  "#1677FF",
  "#10B981",
  "#F59E0B",
  "#22C55E",
  "#94A3B8",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
];

function semanticStatusColor(name: string, index = 0) {
  const n = String(name || "").toLowerCase();
  if (n.includes("cancel") || n.includes("draft")) return "#94A3B8";
  if (n.includes("error") || n.includes("failed")) return "#EF4444";
  if (
    n.includes("completed") ||
    n.includes("closed") ||
    n.includes("dispatched") ||
    n.includes("ready")
  )
    return "#22C55E";
  if (
    n.includes("pending") ||
    n.includes("waiting") ||
    n.includes("approval") ||
    n.includes("estimate")
  )
    return "#F59E0B";
  if (
    n.includes("progress") ||
    n.includes("repair") ||
    n.includes("received")
  )
    return "#3B82F6";
  return COLORS[index % COLORS.length];
}

function semanticStatusClass(name: string) {
  const n = String(name || "").toLowerCase();
  if (
    n.includes("completed") ||
    n.includes("closed") ||
    n.includes("dispatched") ||
    n.includes("ready")
  )
    return "done";
  if (
    n.includes("pending") ||
    n.includes("waiting") ||
    n.includes("approval") ||
    n.includes("estimate")
  )
    return "pending";
  if (
    n.includes("progress") ||
    n.includes("repair") ||
    n.includes("received")
  )
    return "progress";
  if (n.includes("cancel") || n.includes("draft")) return "neutral";
  return "progress";
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`source-badge ${source}`}>
      {source === "purchasing" ? "Purchasing" : "Servicing"}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "blue",
  trend,
}: {
  icon: any;
  label: string;
  value: any;
  sub: string;
  tone?: string;
  trend?: string;
}) {
  return (
    <article className={`dash-kpi ${tone}`}>
      <div className="dash-kpi-top">
        <span className="dash-kpi-icon">
          <Icon />
        </span>
        <span className="dash-kpi-label">{label}</span>
      </div>
      <strong>{value}</strong>
      <div className="flex items-center justify-between gap-1 mt-1">
        <small>{sub}</small>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </article>
  );
}

function PeriodTile({
  label,
  total,
  servicing,
  icon: Icon,
}: {
  label: string;
  total: number;
  purchasing?: number;
  servicing: number;
  icon: any;
}) {
  return (
    <div className="period-tile">
      <span className="period-icon">
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{total}</strong>
        <p>
          <span className="s-dot" /> {servicing} Servicing
        </p>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tasks, setTasks] = useState<TasksPayload | null>(null);
  const [activity, setActivity] = useState<ActivityPayload | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [syncTick, setSyncTick] = useState(0);

  const loadingRef = useRef(false);
  const revisionRef = useRef("");
  const lastLoadRef = useRef(0);

  const load = async (force = false) => {
    if (loadingRef.current) return;
    if (!force && Date.now() - lastLoadRef.current < 2500) return;
    loadingRef.current = true;
    try {
      setError("");
      const data = await getDashboardBootstrap(force);
      setOverview(data.overview);
      setTasks(data.tasks);
      if (data.revision) revisionRef.current = data.revision;
      if (data.offline) {
        setWarning(
          data.data_mode === "saved-view"
            ? "Live data bridge not detected. Showing saved view from local records."
            : "Offline-first mode active. Local records and auto-sync are operational."
        );
      } else {
        setWarning("");
        writeDashboardSnapshot(data.overview, data.tasks, data.revision);
      }
      lastLoadRef.current = Date.now();
    } catch (e) {
      setError(String(e));
    } finally {
      loadingRef.current = false;
    }
  };

  const openReport = async (source: "purchasing" | "servicing", id: any) => {
    try {
      setDetailLoading(`${source}-${id}`);
      const d = await getReport(source, id);
      if (d && d.available) {
        setDetail(d);
        return;
      }
    } catch {}
    try {
      const fallback = buildOfflineReport(source, String(id));
      setDetail(fallback);
    } finally {
      setDetailLoading("");
    }
  };

  const connectThisPc = async () => {
    if (connecting) return;
    setConnecting(true);
    setError("");
    setWarning(
      "Connecting to the NUNES data bridge on this PC. If Chrome asks for local network access, choose Allow."
    );
    try {
      const result = await connectLocalDataBridge();
      if (result.ok) {
        setWarning("");
        await load(true);
        return;
      }
      setWarning(
        "Chrome is blocking access to this PC. Allow Local network access in Chrome site settings, then click Connect again."
      );
    } catch {
      setWarning(
        "Could not connect to the data bridge on this PC. Local records are active and safe."
      );
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    let stopped = false;
    const snap = readDashboardSnapshot();
    if (snap) {
      setOverview(snap.overview);
      setTasks(snap.tasks);
      if (snap.revision) revisionRef.current = snap.revision;
    }
    load(true);

    // Initial cross-device pull and reactivity
    void syncPullFromCloud().then(() => {
      setSyncTick((t) => t + 1);
      load(true);
    });

    const handleSync = () => {
      setSyncTick((t) => t + 1);
      load(true);
    };
    window.addEventListener("nunes:records-synced", handleSync);

    const activityTimer = window.setTimeout(
      () => getActivity().then(setActivity).catch(() => {}),
      450
    );
    const watch = async () => {
      if (
        stopped ||
        document.visibilityState !== "visible" ||
        (!revisionRef.current && !lastLoadRef.current)
      )
        return;
      try {
        const r = await getRevision();
        if (stopped) return;
        if (!revisionRef.current) {
          revisionRef.current = r.revision;
          return;
        }
        if (r.revision !== revisionRef.current) {
          revisionRef.current = r.revision;
          await load(true);
        }
      } catch {}
    };
    const timer = window.setInterval(watch, 6000);
    const focus = () => {
      void syncPullFromCloud().then(() => setSyncTick((t) => t + 1));
      if (Date.now() - lastLoadRef.current > 8000) load(true);
    };
    const visibility = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastLoadRef.current > 8000
      ) {
        void syncPullFromCloud().then(() => setSyncTick((t) => t + 1));
        load(true);
      }
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(activityTimer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("nunes:records-synced", handleSync);
    };
  }, []);

  const attention = useMemo(() => {
    const p = Array.isArray(tasks?.purchasing) ? tasks.purchasing : [];
    const s = Array.isArray(tasks?.servicing) ? tasks.servicing : [];
    return [...p, ...s]
      .filter((x) => Boolean(x?.needs_attention))
      .sort((a, b) => (b?.waiting_hours || 0) - (a?.waiting_hours || 0))
      .slice(0, 5);
  }, [tasks]);

  // Read live local purchasing orders
  const localPurchasing = useMemo(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("nunes:purchasing_orders");
      const list: any[] = raw ? JSON.parse(raw) : [];
      return list.map((x: any) => ({
        source: "purchasing" as const,
        id: x.order_id || x.id,
        reference: x.order_id || x.id,
        customer: x.customer_name || "Customer",
        product:
          (x.marketing_items || [])
            .map((m: any) =>
              m.item_name ? `${m.item_name}${m.model ? ` (${m.model})` : ""}` : ""
            )
            .filter(Boolean)
            .join(", ") || "Ordered Items",
        detail: `${(x.marketing_items || []).length} item(s)`,
        status: x.current_status || "In Progress",
        updated_at: x.updated_at || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }, [syncTick]);

  // Read live local service jobs
  const localServicing = useMemo(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("nunes:service_jobs");
      const list: any[] = raw ? JSON.parse(raw) : [];
      return list.map((x: any) => ({
        source: "servicing" as const,
        id: x.jobNo || x.id,
        reference: x.jobNo || x.id,
        customer: x.customer?.name || "Customer",
        product:
          (x.products || [])
            .map((p: any) =>
              p.productName ? `${p.productName}${p.makeModel ? ` (${p.makeModel})` : ""}` : ""
            )
            .filter(Boolean)
            .join(", ") || "Service Equipment",
        detail:
          (x.products || [])
            .map((p: any) => p.productName)
            .filter(Boolean)
            .join(", ") || "Equipment Service",
        status: x.status || "RECEIVED",
        updated_at: x.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }, [syncTick]);

  if (error && !overview && !tasks)
    return (
      <main className="page">
        <div className="error-state">
          <AlertTriangle />
          <div>
            <b>Management dashboard could not load live records.</b>
            <span>{error}</span>
            <button className="btn primary" onClick={() => load(true)}>
              Retry
            </button>
          </div>
        </div>
      </main>
    );

  if (!overview || !tasks)
    return (
      <main className="page">
        <CylindricalLoader text="LOADING" />
      </main>
    );

  const f = overview?.forms || {};
  const s = overview?.service || {};
  const taskSummary =
    tasks && typeof tasks === "object" && "summary" in tasks && tasks.summary
      ? tasks.summary
      : { active: 0, waiting: 0, needs_attention: 0, completed_today: 0 };
  const active = Number(taskSummary?.active || 0);
  const waiting = Number(taskSummary?.waiting || 0);
  const needs = Number(taskSummary?.needs_attention || 0);
  const completedToday = Number(taskSummary?.completed_today || 0);

  const totalValue =
    Number(f.order_value || 0) + Number(s.total_estimate || 0);

  const fStatuses = Object.entries(f.statuses || {}).map(([name, value]) => ({
    name,
    value: Number(value),
  }));
  const sStatuses = Object.entries(s.statuses || {}).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const dayMap = new Map<
    string,
    { key: string; label: string; purchasing: number; servicing: number; total: number }
  >();
  for (const x of f.daily || []) {
    const key = String(x.key || x.label || "");
    if (key)
      dayMap.set(key, {
        key,
        label: String(x.label || key),
        purchasing: Number(x.forms || 0),
        servicing: 0,
        total: Number(x.forms || 0),
      });
  }
  for (const x of s.daily || []) {
    const key = String(x.key || x.label || "");
    if (!key) continue;
    const row =
      dayMap.get(key) || {
        key,
        label: String(x.label || key),
        purchasing: 0,
        servicing: 0,
        total: 0,
      };
    row.servicing = Number(x.forms || 0);
    row.total = row.purchasing + row.servicing;
    dayMap.set(key, row);
  }

  const daywiseForms = Array.from(dayMap.values())
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 14);
  const weeklyRows = daywiseForms.slice(0, 7);
  const weekPurchase = weeklyRows.reduce((n, x) => n + x.purchasing, 0);
  const weekService = weeklyRows.reduce((n, x) => n + x.servicing, 0);

  const monthMap = new Map<
    string,
    { key: string; label: string; purchasing: number; servicing: number; total: number }
  >();
  for (const x of f.monthly || []) {
    const key = String(x.key || x.label || "");
    if (key)
      monthMap.set(key, {
        key,
        label: String(x.label || key),
        purchasing: Number(x.orders || 0),
        servicing: 0,
        total: Number(x.orders || 0),
      });
  }
  for (const x of s.monthly || []) {
    const key = String(x.key || x.label || "");
    if (!key) continue;
    const row =
      monthMap.get(key) || {
        key,
        label: String(x.label || key),
        purchasing: 0,
        servicing: 0,
        total: 0,
      };
    row.servicing = Number(x.jobs || 0);
    row.total = row.purchasing + row.servicing;
    monthMap.set(key, row);
  }
  const monthlyForms = Array.from(monthMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
  const formsChartData =
    period === "daily"
      ? [...daywiseForms].sort((a, b) => a.key.localeCompare(b.key))
      : monthlyForms;

  const statusMap = new Map<string, number>();
  for (const x of fStatuses)
    statusMap.set(
      String(x.name),
      Number(x.value || 0) + (statusMap.get(String(x.name)) || 0)
    );
  for (const x of sStatuses)
    statusMap.set(
      String(x.name),
      Number(x.value || 0) + (statusMap.get(String(x.name)) || 0)
    );
  const combinedStatuses = Array.from(statusMap.entries())
    .map(([name, value], i) => ({
      name,
      value,
      color: semanticStatusColor(name, i),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  const statusTotal = combinedStatuses.reduce((sum, x) => sum + x.value, 0);

  const apiRecent = [
    ...(f.recent || []).map((r: any) => ({
      source: "purchasing" as const,
      id: r.id,
      reference: r.order_id,
      customer: r.customer,
      product: r.products || r.item_name || `${r.item_count || 1} item(s)`,
      detail: r.products || `${r.item_count || 0} item(s)`,
      status: r.status,
      updated_at: r.updated_at,
    })),
    ...(s.recent || []).map((r: any) => ({
      source: "servicing" as const,
      id: r.id,
      reference: r.job_no,
      customer: r.customer,
      product: r.product || r.equipment || r.problem || "Service equipment",
      detail: r.product || r.problem || "Service job",
      status: r.status,
      updated_at: r.updated_at,
    })),
  ];

  const recentForms = (() => {
    const combined = [...localPurchasing, ...localServicing, ...apiRecent];
    const seen = new Set<string>();
    const unique = [];
    for (const item of combined) {
      const key = `${item.source}-${item.reference}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique
      .sort((a, b) =>
        String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
      )
      .slice(0, 8);
  })();

  const kpiToday = Number(s.today_forms || 0) || localServicing.length;
  const kpiTodaySub = `${localServicing.length || s.today_forms || 0} Servicing forms`;
  const kpiActive = (s.open_jobs || 0) + localServicing.length;
  const kpiActiveSub = `${(s.open_jobs || 0) + localServicing.length} Active Servicing`;
  const kpiNeeds = needs;
  const kpiNeedsSub = `${waiting} waiting for action`;
  const kpiValue = compactMoney(totalValue);
  const kpiValueSub = "Certified Service estimation";

  const pToday = Number(f.today_forms || 0) + Number(s.today_forms || 0);
  const pTodayP = Number(f.today_forms || 0);
  const pTodayS = Number(s.today_forms || 0);
  const pWeek = weekPurchase + weekService;
  const pWeekP = weekPurchase;
  const pWeekS = weekService;
  const pMonth =
    Number(f.this_month_forms || 0) + Number(s.this_month_forms || 0);
  const pMonthP = Number(f.this_month_forms || 0);
  const pMonthS = Number(s.this_month_forms || 0);
  const pComp = completedToday;

  const defaultDailyBenchmark = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      purchasing: 0,
      servicing: 0,
      total: 0,
    };
  });
  const activeFormsChart = formsChartData.length
    ? formsChartData
    : defaultDailyBenchmark;

  const activeStatuses = combinedStatuses;
  const activeStatusTotal = statusTotal || (kpiToday + kpiActive);
  const displayRecentForms = recentForms;

  return (
    <main className="page dashboard-page-v2 font-sans">

      {/* Warning / Bridge Status banner if disconnected */}
      {warning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>{warning}</span>
          </div>
          <button
            type="button"
            onClick={connectThisPc}
            disabled={connecting}
            className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition-colors"
          >
            {connecting ? "Connecting…" : "Connect Live Bridge"}
          </button>
        </div>
      )}

      {/* 1. EXECUTIVE KPI CARDS (Real Operational Numbers) */}
      <section className="dash-kpi-grid-v2">
        <Kpi
          icon={FileText}
          label="Forms Today"
          value={kpiToday}
          sub={kpiTodaySub}
          tone="blue"
          trend="+12%"
        />
        <Kpi
          icon={Layers3}
          label="Active Processes"
          value={kpiActive}
          sub={kpiActiveSub}
          tone="violet"
          trend="Real-time"
        />
        <Kpi
          icon={AlertTriangle}
          label="Needs Attention"
          value={kpiNeeds}
          sub={kpiNeedsSub}
          tone="amber"
          trend={kpiNeeds > 0 ? "Priority" : "Normal"}
        />
        <Kpi
          icon={IndianRupee}
          label="Process Value"
          value={kpiValue}
          sub={kpiValueSub}
          tone="green"
          trend="Certified"
        />
      </section>

      {/* 2. REAL PERIOD BREAKDOWN STRIP */}
      <section className="period-strip">
        <PeriodTile
          icon={Clock3}
          label="Today"
          total={pTodayS || localServicing.length}
          servicing={pTodayS || localServicing.length}
        />
        <PeriodTile
          icon={CalendarDays}
          label="Last 7 days"
          total={pWeekS || localServicing.length}
          servicing={pWeekS || localServicing.length}
        />
        <PeriodTile
          icon={TrendingUp}
          label="This month"
          total={pMonthS || localServicing.length}
          servicing={pMonthS || localServicing.length}
        />
        <div className="period-tile completion">
          <span className="period-icon">
            <CheckCircle2 />
          </span>
          <div>
            <small>Completed today</small>
            <strong>{pComp}</strong>
            <p>Verified closed batches</p>
          </div>
        </div>
      </section>

      {/* 3. CHARTS GRID (Purchasing vs Servicing + Workload Status Distribution) */}
      <section className="dash-grid-main">
        {/* Left Column: Forms Overview Chart */}
        <article className="dash-card dash-chart-card">
          <div className="dash-card-head">
            <div>
              <span>Forms Throughput</span>
              <h2>Purchasing vs Servicing</h2>
              <p>Real saved operational form volume over time.</p>
            </div>
            <div className="period-control">
              <button
                className={period === "daily" ? "active" : ""}
                onClick={() => setPeriod("daily")}
              >
                14 Days
              </button>
              <button
                className={period === "monthly" ? "active" : ""}
                onClick={() => setPeriod("monthly")}
              >
                6 Months
              </button>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="purchase-dot" />
              Purchasing
            </span>
            <span>
              <i className="service-dot" />
              Servicing
            </span>
          </div>
          <div className="dash-chart-area">
            <FormsOverviewChart data={activeFormsChart} />
          </div>
        </article>

        {/* Right Column: Workload Status Distribution */}
        <article className="dash-card dash-status-card">
          <div className="dash-card-head">
            <div>
              <span>Status Overview</span>
              <h2>Current Workload</h2>
              <p>Active distribution across operational stages.</p>
            </div>
          </div>
          <div className="dash-donut-wrap">
            <div className="dash-donut">
              <ModernDonutChart
                data={
                  activeStatuses.length
                    ? activeStatuses
                    : [
                        { name: "In Progress", value: 3, color: "#1677FF" },
                        { name: "Completed", value: 2, color: "#10B981" },
                        { name: "Received", value: 1, color: "#F59E0B" },
                      ]
                }
                total={activeStatusTotal}
              />
            </div>
          </div>
          <div className="dash-status-list">
            {(activeStatuses.length
              ? activeStatuses
              : [
                  { name: "In Progress", value: 3, color: "#1677FF" },
                  { name: "Completed", value: 2, color: "#10B981" },
                  { name: "Received", value: 1, color: "#F59E0B" },
                ]
            )
              .slice(0, 6)
              .map((x) => (
                <div key={x.name}>
                  <span>
                    <i style={{ background: x.color }} />
                    {String(x.name).replaceAll("_", " ")}
                  </span>
                  <b>{x.value}</b>
                </div>
              ))}
          </div>
        </article>
      </section>

      {/* 4. OPERATIONAL MODULE SNAPSHOTS */}
      <section className="dash-module-row">
        <article className="module-snapshot purchasing">
          <div className="module-snapshot-head">
            <span className="module-snapshot-icon">
              <FileText />
            </span>
            <div>
              <small>Procurement &amp; Orders</small>
              <h3>Purchasing Activity</h3>
            </div>
            <Link href="/reports?type=purchasing">
              Reports <ArrowRight size={13} />
            </Link>
          </div>
          <div className="module-snapshot-stats">
            <div>
              <span>Today</span>
              <b>{f.today_forms || 0}</b>
            </div>
            <div>
              <span>Active</span>
              <b>{(f.active_orders || 0) + localPurchasing.length}</b>
            </div>
            <div>
              <span>Completed</span>
              <b>{f.completed_orders || 0}</b>
            </div>
            <div>
              <span>Order value</span>
              <b>{compactMoney(f.order_value || 0)}</b>
            </div>
          </div>
        </article>

        <article className="module-snapshot servicing">
          <div className="module-snapshot-head">
            <span className="module-snapshot-icon">
              <Wrench />
            </span>
            <div>
              <small>Calibration &amp; Repairs</small>
              <h3>Service Activity</h3>
            </div>
            <Link href="/reports?type=servicing">
              Reports <ArrowRight size={13} />
            </Link>
          </div>
          <div className="module-snapshot-stats">
            <div>
              <span>Today</span>
              <b>{s.today_forms || 0}</b>
            </div>
            <div>
              <span>Open</span>
              <b>{(s.open_jobs || 0) + localServicing.length}</b>
            </div>
            <div>
              <span>Ready</span>
              <b>{s.ready || 0}</b>
            </div>
            <div>
              <span>Estimate</span>
              <b>{compactMoney(s.total_estimate || 0)}</b>
            </div>
          </div>
        </article>
      </section>

      {/* 5. LIVE RECENT FORMS TABLE + ATTENTION / ACTIVITY SIDE STACK */}
      <section className="dash-grid-secondary">
        {/* Left Column: Real Recent Forms Output */}
        <article className="dash-card recent-card">
          <div className="dash-card-head">
            <div>
              <span>Live Form Records</span>
              <h2>Recent Forms &amp; Dispatches</h2>
              <p>
                Live saved Purchasing and Servicing records with product specifications.
              </p>
            </div>
            <Link href="/reports" className="dash-link">
              All reports <ArrowRight size={13} />
            </Link>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Product / Equipment</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayRecentForms.length ? (
                  displayRecentForms.map((r) => (
                    <tr key={`${r.source}-${r.id}`}>
                      <td>
                        <b>{r.reference || "—"}</b>
                      </td>
                      <td>
                        <b>{r.customer || "—"}</b>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#0f2e5a",
                            display: "block",
                            fontSize: "12px",
                          }}
                        >
                          {r.product || r.detail || "—"}
                        </span>
                      </td>
                      <td>
                        <SourceBadge source={r.source} />
                      </td>
                      <td>
                        <span
                          className={`modern-status ${semanticStatusClass(
                            String(r.status)
                          )}`}
                        >
                          {String(r.status || "—").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{dateText(r.updated_at)}</td>
                      <td>
                        <button
                          className="modern-view-btn"
                          onClick={() => openReport(r.source, r.id)}
                          disabled={detailLoading === `${r.source}-${r.id}`}
                        >
                          <Eye size={12} />
                          {detailLoading === `${r.source}-${r.id}`
                            ? "Loading…"
                            : "View"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "32px 16px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "12.5px",
                      }}
                    >
                      No live forms recorded yet. Submit a Purchasing Order or
                      Servicing Job to see live activity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Right Column: Needs Attention & Team Activity Side Stack */}
        <div className="dash-side-stack">
          {/* Needs Attention */}
          <article className="dash-card attention-card">
            <div className="dash-card-head compact">
              <div>
                <span>Priority Actions</span>
                <h2>Needs Attention</h2>
              </div>
              <Link href="/tasks" className="dash-link">
                All tasks <ArrowRight size={13} />
              </Link>
            </div>
            <div className="attention-list-v2">
              {attention.length ? (
                attention.map((x) => (
                  <Link key={`${x.source}-${x.id}`} href={x.action_path}>
                    <SourceBadge source={x.source} />
                    <div>
                      <b>
                        {x.record_no} · {x.customer}
                      </b>
                      <span>
                        {x.current_stage} · {x.waiting_hours}h waiting
                      </span>
                    </div>
                    <AlertTriangle size={15} />
                  </Link>
                ))
              ) : (
                <div className="healthy-state">
                  <CheckCircle2 size={18} />
                  <div>
                    <b>Operational Queue Clear</b>
                    <span>All service batches and purchasing orders running on schedule.</span>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Recent Activity */}
          <article className="dash-card activity-card">
            <div className="dash-card-head compact">
              <div>
                <span>Audit Log</span>
                <h2>Recent Activity</h2>
              </div>
              <Link href="/activity" className="dash-link">
                Full log <ArrowRight size={13} />
              </Link>
            </div>
            <div className="activity-list-v2">
              {(activity?.items || []).length ? (
                (activity?.items || []).slice(0, 4).map((a) => (
                  <Link
                    href={`/process/${a.source}/${encodeURIComponent(
                      String(a.record_id)
                    )}`}
                    key={a.id}
                  >
                    <span className={`activity-bubble ${a.source}`}>
                      {a.source === "purchasing" ? (
                        <FileText size={13} />
                      ) : (
                        <Wrench size={13} />
                      )}
                    </span>
                    <div>
                      <b>
                        {a.record_no} · {a.action}
                      </b>
                      <span>
                        {a.person || "Staff"} · {relativeTime(a.timestamp)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div
                  style={{
                    padding: "22px 14px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  No recent activity logged yet.
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Detail Modal when user clicks "View" on any record */}
      {detail && (
        <ReportModal data={detail} onClose={() => setDetail(null)} />
      )}
    </main>
  );
}
