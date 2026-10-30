export interface CloudSyncResult {
  success?: boolean;
  message?: string;
  error?: string;
  cloud_sync?: any;
  google_backup?: any;
  skipped?: boolean;
}

/**
 * Automatically syncs any saved form (Servicing Job, Purchasing Order, or Quotation)
 * to the cloud API (/api/sync/save), Google Drive / Account backup, and any configured Instruasia webhook.
 */
export async function syncFormToCloud(
  type: "servicing" | "purchasing" | "quotation" | "auth_user",
  id: string,
  customer: string,
  data: any
): Promise<CloudSyncResult> {
  try {
    if (typeof window === "undefined") return { skipped: true };

    const webhook_url = localStorage.getItem("nunes:cloud_webhook_url") || "";
    const google_email = localStorage.getItem("nunes:google_backup_email") || "";
    const google_pass = localStorage.getItem("nunes:google_app_password") || "tpqb fhyx dgfx wcpx";
    const google_auto = localStorage.getItem("nunes:google_backup_auto") !== "false";

    const promises: Promise<any>[] = [];

    // 1. General Sync & Cloud Store
    promises.push(
      fetch("/api/sync/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id,
          customer,
          data,
          webhook_url,
        }),
      }).then((r) => r.json()).catch((e) => ({ error: e.message }))
    );

    // 2. Google Account Backup (if user has provided email or auto-sync enabled)
    if (google_auto && google_email && type !== "auth_user") {
      promises.push(
        fetch("/api/backup/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            id,
            customer,
            email: google_email,
            app_password: google_pass,
            data,
            title: `[NUNES BACKUP] ${type.toUpperCase()}: ${id} - ${customer}`,
          }),
        }).then((r) => r.json()).catch((e) => ({ error: e.message }))
      );
    }

    const [syncRes, googleRes] = await Promise.all(promises);

    // Notify all open pages and widgets on this device immediately
    try {
      window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { type, id } }));
    } catch {}

    return {
      success: syncRes?.success ?? true,
      message: syncRes?.message || "Form synchronized",
      cloud_sync: syncRes,
      google_backup: googleRes,
    };
  } catch (err: any) {
    console.warn("Cloud sync warning (saved locally):", err.message);
    try {
      window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { type, id } }));
    } catch {}
    return { error: err.message || "Failed to reach cloud endpoint" };
  }
}

/**
 * Pulls all synchronized records from the server and merges them into this device's localStorage
 * ensuring every device sees all filled forms, service jobs, purchasing orders, and quotations.
 */
export async function syncPullFromCloud(): Promise<{ success: boolean; pulled?: any; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Browser required" };

  try {
    let remote: any = null;

    // 1. Try Next.js server route first
    try {
      const res = await fetch("/api/sync/save", { cache: "no-store" });
      if (res.ok) {
        remote = await res.json();
      }
    } catch {}

    // 2. Direct Cloud KV Fallback if server returned no records
    const hasRecords = remote && (
      (Array.isArray(remote.service_jobs) && remote.service_jobs.length > 0) ||
      (Array.isArray(remote.purchasing_orders) && remote.purchasing_orders.length > 0) ||
      (Array.isArray(remote.quotations) && remote.quotations.length > 0)
    );

    if (!hasRecords) {
      try {
        const cloudRes = await fetch("https://7ne1nlc0ugijs61k.public.blob.vercel-storage.com/nunes_cloud_store.json", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (cloudRes.ok) {
          const cloudJson = await cloudRes.json();
          if (cloudJson) {
            remote = {
              success: true,
              service_jobs: cloudJson.service_jobs || [],
              purchasing_orders: cloudJson.purchasing_orders || [],
              quotations: cloudJson.quotations || [],
            };
          }
        }
      } catch {}
    }

    if (!remote || !remote.success) return { success: false, error: "Invalid sync response" };

    let updatedAny = false;

    // 1. Merge Service Jobs
    if (Array.isArray(remote.service_jobs)) {
      const localRaw = localStorage.getItem("nunes:service_jobs");
      const localList: any[] = localRaw ? JSON.parse(localRaw) : [];
      const map = new Map<string, any>();
      // Put remote jobs
      for (const item of remote.service_jobs) {
        const key = String(item.id || item.jobNo);
        if (key) map.set(key, item);
      }
      // Merge local jobs (prefer local if newer, push un-synced to cloud)
      for (const item of localList) {
        const key = String(item.id || item.jobNo);
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, item);
          void syncFormToCloud("servicing", String(item.jobNo || item.id), String(item.customer?.name || "Customer"), item);
        }
      }
      if (map.size > 0) {
        localStorage.setItem("nunes:service_jobs", JSON.stringify(Array.from(map.values())));
        updatedAny = true;
      }
    }

    // 2. Merge Purchasing Orders
    if (Array.isArray(remote.purchasing_orders)) {
      const localRaw = localStorage.getItem("nunes:purchasing_orders");
      const localList: any[] = localRaw ? JSON.parse(localRaw) : [];
      const map = new Map<string, any>();
      for (const item of remote.purchasing_orders) {
        const key = String(item.id || item.order_id);
        if (key) map.set(key, item);
      }
      for (const item of localList) {
        const key = String(item.id || item.order_id);
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, item);
          void syncFormToCloud("purchasing", String(item.order_id || item.id), String(item.customer_name || "Customer"), item);
        }
      }
      if (map.size > 0) {
        localStorage.setItem("nunes:purchasing_orders", JSON.stringify(Array.from(map.values())));
        updatedAny = true;
      }
    }

    // 3. Merge Quotations
    if (Array.isArray(remote.quotations)) {
      const localRaw = localStorage.getItem("nunes:quotations");
      const localList: any[] = localRaw ? JSON.parse(localRaw) : [];
      const map = new Map<string, any>();
      for (const item of remote.quotations) {
        const key = String(item.id || item.quotation_no);
        if (key) map.set(key, item);
      }
      for (const item of localList) {
        const key = String(item.id || item.quotation_no);
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, item);
          void syncFormToCloud("quotation", String(item.quotation_no || item.id), String(item.customer_name || "Customer"), item);
        }
      }
      if (map.size > 0) {
        localStorage.setItem("nunes:quotations", JSON.stringify(Array.from(map.values())));
        updatedAny = true;
      }
    }

    if (updatedAny) {
      try {
        window.dispatchEvent(new CustomEvent("nunes:records-synced"));
      } catch {}
    }

    return {
      success: true,
      pulled: {
        service_jobs: remote.service_jobs?.length || 0,
        purchasing_orders: remote.purchasing_orders?.length || 0,
        quotations: remote.quotations?.length || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Triggers a complete backup of all local operational records to the configured Google Account.
 */
export async function backupAllToGoogle(email?: string, appPassword?: string) {
  if (typeof window === "undefined") return { success: false, error: "Browser environment required" };

  const targetEmail = email || localStorage.getItem("nunes:google_backup_email") || "";
  const pass = appPassword || localStorage.getItem("nunes:google_app_password") || "tpqb fhyx dgfx wcpx";

  if (!targetEmail) {
    return { success: false, error: "Please enter your Google / Gmail address in Settings first." };
  }

  const sJobs = JSON.parse(localStorage.getItem("nunes:service_jobs") || "[]");
  const pOrders = JSON.parse(localStorage.getItem("nunes:purchasing_orders") || "[]");
  const quotes = JSON.parse(localStorage.getItem("nunes:quotations") || "[]");

  const fullPayload = {
    exported_at: new Date().toISOString(),
    facility: "NUNES Instrumentation Coimbatore",
    total_service_jobs: sJobs.length,
    total_purchasing_orders: pOrders.length,
    total_quotations: quotes.length,
    service_jobs: sJobs,
    purchasing_orders: pOrders,
    quotations: quotes,
  };

  const res = await fetch("/api/backup/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "full_system_backup",
      id: `FULL-BACKUP-${new Date().toISOString().slice(0, 10)}`,
      customer: "NUNES Facility Master Backup",
      email: targetEmail,
      app_password: pass,
      data: fullPayload,
      title: `[MASTER BACKUP] NUNES Operations Full Backup - ${new Date().toLocaleDateString("en-IN")}`,
    }),
  });

  return await res.json();
}
