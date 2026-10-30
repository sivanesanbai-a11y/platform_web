import { NextRequest, NextResponse } from "next/server";
import { getServerStore, refreshServerStoreFromCloud } from "@/lib/serverStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORM_VERSION = "6.5.0";

function upstream(): string | null {
  const configured = (process.env.NUNES_API_INTERNAL_URL || process.env.NUNES_API_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");
  if (!process.env.VERCEL) return "http://127.0.0.1:8865";
  return null;
}

async function handleLocalDataRoute(subpath: string) {
  const store = await refreshServerStoreFromCloud();
  const clean = subpath.toLowerCase().replace(/^\/+|\/+$/g, "");

  // 1. Process Status for Reports Page
  if (clean.includes("process-status") || clean.includes("process_status")) {
    const purchasing = store.purchasing_orders.map((x: any) => ({
      id: x.order_id || x.id,
      order_id: x.order_id || x.id,
      customer: x.customer_name || "Client",
      product: Array.isArray(x.marketing_items) && x.marketing_items.length > 0
        ? x.marketing_items.map((m: any) => m.item_name).filter(Boolean).join(", ")
        : "Ordered Items",
      branch: x.branch || "MAIN",
      market_type: x.market_type || "IND",
      status: x.current_status || x.status || "In Progress",
      current_stage: x.current_status || "Marketing",
      progress: 35,
      value: Number(x.total_order_value || x.bill_amount || 0),
      staff: x.marketing_person ? [x.marketing_person] : ["Staff"],
      updated_at: x.updated_at || new Date().toISOString(),
    }));

    const servicing = store.service_jobs.map((j: any) => ({
      id: j.jobNo || j.id,
      job_no: j.jobNo || j.id,
      customer: j.customer?.name || "Customer",
      product: Array.isArray(j.products) && j.products.length > 0
        ? j.products.map((p: any) => p.productName).filter(Boolean).join(", ")
        : "Equipment Service",
      branch: j.branchName || "Head Office",
      status: j.status || "RECEIVED",
      current_stage: j.status || "Received",
      progress: 25,
      estimate: Number(j.totals?.totalEstimate || 0),
      staff: [j.signoff?.repairedBy || "Technician"],
      updated_at: j.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        purchasing,
        servicing,
        generated_at: new Date().toISOString(),
      },
      { headers: { "x-nunes-data-backend": "embedded-cloud" } }
    );
  }

  // 2. Tasks for Work Queue
  if (clean.includes("task")) {
    const pTasks = store.purchasing_orders.map((x: any, i: number) => ({
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

    const sTasks = store.service_jobs.map((j: any, i: number) => ({
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

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        purchasing: pTasks,
        servicing: sTasks,
        summary: {
          active: pTasks.length + sTasks.length,
          waiting: 0,
          needs_attention: 0,
          completed_today: 0,
        },
      },
      { headers: { "x-nunes-data-backend": "embedded-cloud" } }
    );
  }

  // 3. Activity feed for Dashboard
  if (clean.includes("activity")) {
    const sItems = store.service_jobs.slice(0, 10).map((j: any) => ({
      id: `act-s-${j.id || j.jobNo}`,
      source: "servicing" as const,
      record_id: j.id || j.jobNo,
      record_no: j.jobNo || j.id,
      customer: j.customer?.name || "Customer",
      person: j.signoff?.repairedBy || "Service Tech",
      action: `Service job updated to ${j.status || "RECEIVED"}`,
      timestamp: j.updatedAt || new Date().toISOString(),
    }));

    const pItems = store.purchasing_orders.slice(0, 10).map((x: any) => ({
      id: `act-p-${x.id || x.order_id}`,
      source: "purchasing" as const,
      record_id: x.id || x.order_id,
      record_no: x.order_id || x.id,
      customer: x.customer_name || "Customer",
      person: x.marketing_person || "Purchasing Rep",
      action: `Purchasing order saved: ${x.current_status || "In Progress"}`,
      timestamp: x.updated_at || new Date().toISOString(),
    }));

    const items = [...sItems, ...pItems].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15);

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        items,
        source_counts: {
          purchasing: store.purchasing_orders.length,
          servicing: store.service_jobs.length,
        },
      },
      { headers: { "x-nunes-data-backend": "embedded-cloud" } }
    );
  }

  if (clean.includes("service-job") || clean.includes("servicing")) {
    return NextResponse.json(store.service_jobs, { headers: { "x-nunes-data-backend": "embedded-cloud" } });
  }
  if (clean.includes("purchasing") || clean.includes("order")) {
    return NextResponse.json(store.purchasing_orders, { headers: { "x-nunes-data-backend": "embedded-cloud" } });
  }
  if (clean.includes("quotation")) {
    return NextResponse.json(store.quotations, { headers: { "x-nunes-data-backend": "embedded-cloud" } });
  }
  if (clean.includes("customer")) {
    return NextResponse.json(store.customers, { headers: { "x-nunes-data-backend": "embedded-cloud" } });
  }
  if (clean.includes("supplier")) {
    return NextResponse.json(store.suppliers, { headers: { "x-nunes-data-backend": "embedded-cloud" } });
  }

  // 4. Overview
  if (clean.includes("overview")) {
    const serviceJobs = store.service_jobs;
    const purchasingOrders = store.purchasing_orders;
    const pVal = purchasingOrders.reduce((sum: number, x: any) => sum + Number(x.total_order_value || x.bill_amount || 0), 0);
    const sVal = serviceJobs.reduce((sum: number, j: any) => sum + Number(j.totals?.totalEstimate || 0), 0);

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        total_service_jobs: serviceJobs.length,
        total_purchasing_orders: purchasingOrders.length,
        total_quotations: store.quotations.length,
        total_revenue: pVal + sVal,
        facility_status: "OPERATIONAL",
        active_branches: ["Coimbatore (Head Office)", "Peelamedu Works"],
        system_health: "OPTIMAL",
        forms: {
          total_orders: purchasingOrders.length,
          active_orders: purchasingOrders.length,
          completed_orders: 0,
          today_forms: purchasingOrders.length,
          this_month_forms: purchasingOrders.length,
          order_value: pVal,
          outstanding: 0,
          statuses: { "In Progress": purchasingOrders.length || 1 },
          recent: purchasingOrders.slice(0, 8),
        },
        service: {
          open_jobs: serviceJobs.length,
          total_jobs: serviceJobs.length,
          ready: 0,
          today_forms: serviceJobs.length,
          this_month_forms: serviceJobs.length,
          total_estimate: sVal,
          statuses: { RECEIVED: serviceJobs.length || 1 },
          recent: serviceJobs.slice(0, 8),
        },
      },
      { headers: { "x-nunes-data-backend": "embedded-cloud" } }
    );
  }

  return NextResponse.json(
    {
      store_status: "online",
      counts: {
        service_jobs: store.service_jobs.length,
        purchasing_orders: store.purchasing_orders.length,
        quotations: store.quotations.length,
      },
    },
    { headers: { "x-nunes-data-backend": "embedded-cloud" } }
  );
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const safePath = path.map(encodeURIComponent).join("/");
  const base = upstream();

  if (!base) {
    return await handleLocalDataRoute(safePath);
  }

  const url = `${base}/api/${safePath}${req.nextUrl.search}`;
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const dataToken = (process.env.NUNES_DATA_API_TOKEN || "").trim();
  if (dataToken) headers.set("authorization", `Bearer ${dataToken}`);
  headers.set("x-nunes-platform-version", PLATFORM_VERSION);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2800);
  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    signal: controller.signal,
  };
  if (!["GET", "HEAD"].includes(req.method)) init.body = await req.text();

  try {
    const res = await fetch(url, init);
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-nunes-data-backend": "persistent",
      },
    });
  } catch {
    // Graceful fallback to embedded local cloud store
    return await handleLocalDataRoute(safePath);
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
