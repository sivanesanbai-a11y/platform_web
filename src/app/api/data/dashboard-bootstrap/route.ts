import { NextResponse } from "next/server";
import { getServerStore, refreshServerStoreFromCloud } from "@/lib/serverStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORM_VERSION = "6.5.0";
type ServerCache = { time: number; data: any };
let warmCache: ServerCache | null = null;

function upstream(): string | null {
  const configured = (process.env.NUNES_API_INTERNAL_URL || process.env.NUNES_API_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");
  if (!process.env.VERCEL) return "http://127.0.0.1:8766";
  return null;
}

async function pull(base: string, path: string, signal: AbortSignal) {
  const headers: Record<string, string> = { "x-nunes-platform-version": PLATFORM_VERSION };
  const token = (process.env.NUNES_DATA_API_TOKEN || "").trim();
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/api/${path}`, { cache: "no-store", headers, signal });
  if (!res.ok) {
    let detail = "";
    try {
      const d = await res.json();
      detail = d?.error || d?.detail || "";
    } catch {}
    throw new Error(`${path} returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

function buildLocalBootstrap(store: any) {
  const serviceJobs = Array.isArray(store?.service_jobs) ? store.service_jobs : [];
  const purchasingOrders = Array.isArray(store?.purchasing_orders) ? store.purchasing_orders : [];
  const quotations = Array.isArray(store?.quotations) ? store.quotations : [];

  const serviceCount = serviceJobs.length;
  const purchasingCount = purchasingOrders.length;
  const quoteCount = quotations.length;

  const pVal = purchasingOrders.reduce((sum: number, x: any) => sum + Number(x.total_order_value || x.bill_amount || 0), 0);
  const sVal = serviceJobs.reduce((sum: number, j: any) => sum + Number(j.totals?.totalEstimate || 0), 0);
  const qVal = quotations.reduce((sum: number, q: any) => sum + Number(q.total_amount || 0), 0);
  const totalRev = pVal + sVal + qVal;

  const pActive = purchasingOrders.filter((x: any) => (x.current_status || x.status) !== "Completed").length;
  const sOpen = serviceJobs.filter((x: any) => x.status !== "CLOSED" && x.status !== "DISPATCHED").length;

  const pRecent = purchasingOrders.slice(0, 8).map((x: any) => ({
    id: x.id || x.order_id,
    order_id: x.order_id || x.id,
    customer: x.customer_name || "Customer",
    products: Array.isArray(x.marketing_items) && x.marketing_items.length > 0
      ? x.marketing_items.map((m: any) => m.item_name).filter(Boolean).join(", ")
      : "Purchasing Order",
    status: x.current_status || x.status || "In Progress",
    updated_at: x.updated_at || new Date().toISOString(),
  }));

  const sRecent = serviceJobs.slice(0, 8).map((j: any) => ({
    id: j.id || j.jobNo,
    job_no: j.jobNo || j.id,
    customer: j.customer?.name || "Customer",
    product: Array.isArray(j.products) && j.products.length > 0
      ? j.products.map((p: any) => p.productName).filter(Boolean).join(", ")
      : "Service Equipment",
    status: j.status || "RECEIVED",
    updated_at: j.updatedAt || new Date().toISOString(),
  }));

  const pTasks = purchasingOrders.map((x: any, i: number) => ({
    id: x.id || i,
    source: "purchasing" as const,
    record_no: x.order_id || String(x.id),
    customer: x.customer_name || "Customer",
    branch: x.branch || "MAIN",
    current_stage: x.current_status || "Marketing",
    status: x.current_status || "In Progress",
    progress: 1,
    responsible_team: "Purchasing",
    priority: "Normal" as const,
    updated_at: x.updated_at || new Date().toISOString(),
    waiting_hours: 1,
    needs_attention: false,
    action_path: `/forms/purchasing?id=${encodeURIComponent(x.order_id || x.id)}`,
  }));

  const sTasks = serviceJobs.map((j: any, i: number) => ({
    id: j.id || i,
    source: "servicing" as const,
    record_no: j.jobNo || String(j.id),
    customer: j.customer?.name || "Customer",
    product: j.products?.[0]?.productName || "Equipment",
    branch: j.branchName || "Main Office",
    current_stage: j.status || "RECEIVED",
    status: j.status || "RECEIVED",
    progress: 1,
    responsible_team: "Service",
    priority: "Normal" as const,
    updated_at: j.updatedAt || new Date().toISOString(),
    waiting_hours: 1,
    needs_attention: false,
    action_path: `/forms/servicing?id=${encodeURIComponent(j.jobNo || j.id)}`,
  }));

  const overview = {
    generated_at: new Date().toISOString(),
    total_service_jobs: serviceCount,
    total_purchasing_orders: purchasingCount,
    total_quotations: quoteCount,
    total_revenue: totalRev,
    facility_status: "OPERATIONAL",
    active_branches: ["Coimbatore (Head Office)", "Peelamedu Works"],
    system_health: "OPTIMAL",
    synced_records: serviceCount + purchasingCount + quoteCount,
    forms: {
      total_orders: purchasingCount,
      active_orders: pActive,
      completed_orders: purchasingCount - pActive,
      this_month_orders: purchasingCount,
      today_forms: purchasingCount,
      this_month_forms: purchasingCount,
      order_value: pVal,
      outstanding: purchasingOrders.reduce((sum: number, x: any) => sum + Number(x.payment_balance || 0), 0),
      statuses: {
        "In Progress": pActive || 1,
        ...(purchasingCount - pActive > 0 ? { Completed: purchasingCount - pActive } : {}),
      },
      monthly: [],
      daily: [],
      stage_completion: [],
      recent: pRecent,
      latest_output: null,
    },
    service: {
      open_jobs: sOpen,
      total_jobs: serviceCount,
      ready: serviceJobs.filter((x: any) => x.status === "READY").length,
      today_forms: serviceCount,
      this_month_forms: serviceCount,
      total_estimate: sVal,
      statuses: {
        RECEIVED: sOpen || 1,
        ...(serviceCount - sOpen > 0 ? { COMPLETED: serviceCount - sOpen } : {}),
      },
      branches: [],
      monthly: [],
      daily: [],
      recent: sRecent,
      latest_output: null,
    },
    modules: {},
    system: { data_state: "online" },
  };

  const tasks = {
    generated_at: new Date().toISOString(),
    purchasing: pTasks,
    servicing: sTasks,
    summary: {
      active: pActive + sOpen,
      waiting: 0,
      needs_attention: 0,
      completed_today: (purchasingCount - pActive) + (serviceCount - sOpen),
    },
  };

  return {
    overview,
    tasks,
    service_jobs: serviceJobs,
    purchasing_orders: purchasingOrders,
    quotations,
    revision: `rev-${Date.now()}`,
    generated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const base = upstream();
  const store = await refreshServerStoreFromCloud();

  if (!base) {
    const localData = buildLocalBootstrap(store);
    return NextResponse.json(localData, {
      headers: { "cache-control": "private, no-store", "x-nunes-data-backend": "embedded-cloud" },
    });
  }

  // Warm-instance micro-cache
  if (warmCache && Date.now() - warmCache.time < 1800) {
    return NextResponse.json(warmCache.data, {
      headers: { "cache-control": "private, no-store", "x-nunes-cache": "warm" },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2800);
  try {
    const [overview, tasks, revision] = await Promise.all([
      pull(base, "overview", controller.signal),
      pull(base, "tasks", controller.signal),
      pull(base, "revision", controller.signal),
    ]);
    const data = {
      overview,
      tasks,
      service_jobs: store.service_jobs,
      purchasing_orders: store.purchasing_orders,
      quotations: store.quotations,
      revision: revision?.revision || "",
      generated_at: new Date().toISOString(),
    };
    warmCache = { time: Date.now(), data };
    return NextResponse.json(data, {
      headers: { "cache-control": "private, no-store", "x-nunes-data-backend": "persistent" },
    });
  } catch {
    // Graceful fallback to serverStore on upstream failure
    const localData = buildLocalBootstrap(store);
    return NextResponse.json(localData, {
      headers: { "cache-control": "private, no-store", "x-nunes-data-backend": "embedded-cloud-fallback" },
    });
  } finally {
    clearTimeout(timeout);
  }
}
