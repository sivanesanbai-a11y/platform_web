import { NextRequest, NextResponse } from "next/server";
import {
  getServerStore,
  refreshServerStoreFromCloud,
  upsertServiceJobAsync,
  upsertPurchasingOrderAsync,
  upsertQuotationAsync,
  upsertAuthUserAsync,
  purgeAllStoreDataAsync,
} from "@/lib/serverStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await refreshServerStoreFromCloud();
    return NextResponse.json({
      success: true,
      service_jobs: store.service_jobs,
      purchasing_orders: store.purchasing_orders,
      quotations: store.quotations,
      customers: store.customers,
      suppliers: store.suppliers,
      users: store.users.map((u) => ({ email: u.email, createdAt: u.createdAt })),
      last_updated: store.last_updated,
    });
  } catch (err: any) {
    const fallbackStore = getServerStore();
    return NextResponse.json({
      success: true,
      service_jobs: fallbackStore.service_jobs,
      purchasing_orders: fallbackStore.purchasing_orders,
      quotations: fallbackStore.quotations,
      customers: fallbackStore.customers,
      suppliers: fallbackStore.suppliers,
      users: fallbackStore.users.map((u) => ({ email: u.email, createdAt: u.createdAt })),
      last_updated: fallbackStore.last_updated,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, id, customer, data, webhook_url } = payload;
    const itemData = data || payload.record;

    // Persist and synchronize directly into Vercel Blob store
    if ((type === "servicing" || type === "service_job") && itemData) {
      await upsertServiceJobAsync(itemData);
    } else if ((type === "purchasing" || type === "purchasing_order") && itemData) {
      await upsertPurchasingOrderAsync(itemData);
    } else if (type === "quotation" && itemData) {
      await upsertQuotationAsync(itemData);
    } else if (type === "auth_user" && itemData?.email && itemData?.password) {
      await upsertAuthUserAsync(itemData.email, itemData.password);
    }

    const cloudUrl =
      (webhook_url || process.env.NUNES_CLOUD_WEBHOOK_URL || process.env.NUNES_API_URL || "").trim();

    let externalSyncResult: any = null;

    // Optional forward if an external webhook is specified
    if (cloudUrl && cloudUrl.startsWith("http")) {
      try {
        const forwardRes = await fetch(cloudUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-nunes-source": "nunes-operations-platform",
          },
          body: JSON.stringify({
            event: "form_submission",
            type,
            id,
            customer,
            data,
            submitted_at: new Date().toISOString(),
          }),
        });

        externalSyncResult = {
          forwarded: true,
          status: forwardRes.status,
          ok: forwardRes.ok,
        };
      } catch (err: any) {
        externalSyncResult = {
          forwarded: false,
          error: err.message || "Failed to reach remote webhook",
        };
      }
    }

    const store = getServerStore();

    return NextResponse.json({
      success: true,
      message: "Form recorded and synchronized across devices",
      record_id: id || `rec-${Date.now()}`,
      synced_at: new Date().toISOString(),
      counts: {
        service_jobs: store.service_jobs.length,
        purchasing_orders: store.purchasing_orders.length,
        quotations: store.quotations.length,
      },
      cloud_sync: externalSyncResult || {
        status: "saved_to_cloud_store",
        device_sync: "active",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error during form save",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await purgeAllStoreDataAsync();
  return NextResponse.json({
    success: true,
    message: "All operational records permanently purged",
  });
}
