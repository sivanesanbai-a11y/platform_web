import { generateServiceJobsCsv } from "@/lib/excel-export";
import type { ServiceJob } from "@/types/service-job";

export interface CloudSyncResult {
  success?: boolean;
  message?: string;
  error?: string;
  cloud_sync?: any;
  google_backup?: any;
  skipped?: boolean;
  updated?: boolean;
}

export function sortJobsDeterministically<T extends Record<string, any>>(jobs: T[]): T[] {
  if (!Array.isArray(jobs)) return [];
  return [...jobs].sort((a, b) => {
    const getTs = (j: any) => {
      const d = j?.createdAt || j?.jobDate || j?.customer?.date || j?.receipt?.mrDate || j?.updatedAt;
      if (!d) return 0;
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };
    const timeA = getTs(a);
    const timeB = getTs(b);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const idA = String(a?.jobNo || a?.id || "");
    const idB = String(b?.jobNo || b?.id || "");
    return idB.localeCompare(idA, undefined, { numeric: true });
  });
}

export function sortOrdersDeterministically<T extends Record<string, any>>(orders: T[]): T[] {
  if (!Array.isArray(orders)) return [];
  return [...orders].sort((a, b) => {
    const timeA = new Date(a?.order_date || a?.date || a?.updated_at || a?.created_at || 0).getTime();
    const timeB = new Date(b?.order_date || b?.date || b?.updated_at || b?.created_at || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    const idA = String(a?.order_id || a?.id || "");
    const idB = String(b?.order_id || b?.id || "");
    return idB.localeCompare(idA, undefined, { numeric: true });
  });
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

    // 2. Automated Excel / Google Drive Sheet Backup (Auto-Sync to Google Account)
    if (google_auto && type !== "auth_user") {
      try {
        const rawJobs = localStorage.getItem("nunes:service_jobs");
        const currentJobs: ServiceJob[] = rawJobs ? JSON.parse(rawJobs) : [];
        if (type === "servicing" && data) {
          const exists = currentJobs.some((j: any) => String(j.jobNo || j.id) === String(data.jobNo || data.id));
          if (!exists) currentJobs.unshift(data);
        }
        const sheetCsv = generateServiceJobsCsv(currentJobs);

        promises.push(
          fetch("/api/backup/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "drive_sheet_backup",
              id: `AUTO-SHEET-${id}`,
              customer,
              email: google_email || "nunesinstruments@gmail.com",
              app_password: google_pass,
              data: {
                total_forms: currentJobs.length,
                backup_type: "Automatic Excel / Google Drive Sheet Sync",
                timestamp: new Date().toISOString(),
                saved_record_id: id,
                record_customer: customer,
              },
              sheet_csv: sheetCsv,
              title: `[NUNES AUTOMATIC EXCEL / DRIVE SHEET] ${currentJobs.length} Forms Auto-Synced (${new Date().toLocaleDateString("en-IN")})`,
            }),
          }).then((r) => r.json()).catch((e) => ({ error: e.message }))
        );
      } catch (sheetErr) {
        console.warn("Automated sheet backup generation warning:", sheetErr);
      }
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
let clientSyncInFlight: Promise<any> | null = null;
let lastClientSyncTime = 0;

export interface PullSyncResult {
  success: boolean;
  updated?: boolean;
  pulled?: any;
  error?: string;
}

export async function syncPullFromCloud(force = false): Promise<PullSyncResult> {
  if (typeof window === "undefined") return { success: false, error: "Browser required" };

  if (!force && Date.now() - lastClientSyncTime < 2500) {
    return { success: true, updated: false };
  }

  if (clientSyncInFlight) {
    return clientSyncInFlight;
  }

  clientSyncInFlight = (async () => {
    try {
      let remote: any = null;

      // 1. Fetch authoritative state from server route
      try {
        const res = await fetch("/api/sync/save", { cache: "no-store" });
        if (res.ok) {
          remote = await res.json();
        }
      } catch {}

      if (!remote || !remote.success) return { success: false, error: "Invalid sync response" };

      let updatedAny = false;
      lastClientSyncTime = Date.now();

      // 1. Intelligent Two-Way Sync for Service Jobs (All Devices)
      if (Array.isArray(remote.service_jobs)) {
        const localRaw = localStorage.getItem("nunes:service_jobs");
        const localJobs: any[] = localRaw ? JSON.parse(localRaw) : [];
        const jobsMap = new Map<string, any>();

        // Seed with server records
        for (const rJob of remote.service_jobs) {
          const key = String(rJob.jobNo || rJob.id);
          if (key) jobsMap.set(key, rJob);
        }

        // Merge with local records: preserve newer local edits or missing jobs
        const missingOnRemote: any[] = [];
        for (const lJob of localJobs) {
          const key = String(lJob.jobNo || lJob.id);
          if (!key) continue;

          if (!jobsMap.has(key)) {
            jobsMap.set(key, lJob);
            missingOnRemote.push(lJob);
          } else {
            const remoteJob = jobsMap.get(key);
            const localTime = new Date(lJob.updatedAt || lJob.jobDate || 0).getTime();
            const remoteTime = new Date(remoteJob.updatedAt || remoteJob.jobDate || 0).getTime();
            const localHasPrice = Boolean(lJob.workflow?.customApprovedPrice || lJob.totals?.totalEstimateManual);
            const remoteHasPrice = Boolean(remoteJob.workflow?.customApprovedPrice || remoteJob.totals?.totalEstimateManual);

            if (localTime > remoteTime || (localHasPrice && !remoteHasPrice)) {
              jobsMap.set(key, lJob);
              missingOnRemote.push(lJob);
            }
          }
        }

        const mergedJobs = sortJobsDeterministically(Array.from(jobsMap.values()));
        const currentSortedLocal = sortJobsDeterministically(localJobs);
        if (JSON.stringify(mergedJobs) !== JSON.stringify(currentSortedLocal) || JSON.stringify(mergedJobs) !== localRaw) {
          localStorage.setItem("nunes:service_jobs", JSON.stringify(mergedJobs));
          updatedAny = true;
        }

        // Push local missing/newer items to the cloud so all devices receive them
        if (missingOnRemote.length > 0) {
          for (const missing of missingOnRemote.slice(0, 5)) {
            void fetch("/api/sync/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "servicing",
                id: String(missing.jobNo || missing.id),
                customer: String(missing.customer?.name || "Customer"),
                data: missing,
              }),
            }).catch(() => {});
          }
        }
      }

      // 2. Intelligent Two-Way Sync for Purchasing Orders
      if (Array.isArray(remote.purchasing_orders)) {
        const localRaw = localStorage.getItem("nunes:purchasing_orders");
        const localOrders: any[] = localRaw ? JSON.parse(localRaw) : [];
        const ordersMap = new Map<string, any>();

        for (const rOrder of remote.purchasing_orders) {
          const key = String(rOrder.order_id || rOrder.id);
          if (key) ordersMap.set(key, rOrder);
        }

        const missingOrdersOnRemote: any[] = [];
        for (const lOrder of localOrders) {
          const key = String(lOrder.order_id || lOrder.id);
          if (!key) continue;
          if (!ordersMap.has(key)) {
            ordersMap.set(key, lOrder);
            missingOrdersOnRemote.push(lOrder);
          }
        }

        const mergedOrders = sortOrdersDeterministically(Array.from(ordersMap.values()));
        const currentSortedLocalOrders = sortOrdersDeterministically(localOrders);
        if (JSON.stringify(mergedOrders) !== JSON.stringify(currentSortedLocalOrders) || JSON.stringify(mergedOrders) !== localRaw) {
          localStorage.setItem("nunes:purchasing_orders", JSON.stringify(mergedOrders));
          updatedAny = true;
        }

        if (missingOrdersOnRemote.length > 0) {
          for (const missing of missingOrdersOnRemote.slice(0, 5)) {
            void fetch("/api/sync/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "purchasing",
                id: String(missing.order_id || missing.id),
                customer: String(missing.customer_name || "Customer"),
                data: missing,
              }),
            }).catch(() => {});
          }
        }
      }

      // 3. Sync Quotations from Server
      if (Array.isArray(remote.quotations)) {
        const localRaw = localStorage.getItem("nunes:quotations");
        const localQuotes: any[] = localRaw ? JSON.parse(localRaw) : [];
        const quotesMap = new Map<string, any>();

        for (const rQuote of remote.quotations) {
          const key = String(rQuote.quotation_no || rQuote.id);
          if (key) quotesMap.set(key, rQuote);
        }
        for (const lQuote of localQuotes) {
          const key = String(lQuote.quotation_no || lQuote.id);
          if (key && !quotesMap.has(key)) quotesMap.set(key, lQuote);
        }

        const mergedQuotes = Array.from(quotesMap.values()).sort((a: any, b: any) => {
          const tA = new Date(a?.quotation_date || a?.date || a?.created_at || 0).getTime();
          const tB = new Date(b?.quotation_date || b?.date || b?.created_at || 0).getTime();
          if (tB !== tA) return tB - tA;
          return String(b?.quotation_no || b?.id || "").localeCompare(String(a?.quotation_no || a?.id || ""), undefined, { numeric: true });
        });
        const currentSortedQuotes = [...localQuotes].sort((a: any, b: any) => {
          const tA = new Date(a?.quotation_date || a?.date || a?.created_at || 0).getTime();
          const tB = new Date(b?.quotation_date || b?.date || b?.created_at || 0).getTime();
          if (tB !== tA) return tB - tA;
          return String(b?.quotation_no || b?.id || "").localeCompare(String(a?.quotation_no || a?.id || ""), undefined, { numeric: true });
        });
        if (JSON.stringify(mergedQuotes) !== JSON.stringify(currentSortedQuotes) || JSON.stringify(mergedQuotes) !== localRaw) {
          localStorage.setItem("nunes:quotations", JSON.stringify(mergedQuotes));
          updatedAny = true;
        }
      }

      // 4. Sync Customers
      if (Array.isArray(remote.customers)) {
        const cRaw = localStorage.getItem("nunes:customers");
        const newRaw = JSON.stringify(remote.customers);
        if (cRaw !== newRaw) {
          localStorage.setItem("nunes:customers", newRaw);
          localStorage.setItem("nunes_customers", newRaw);
          updatedAny = true;
        }
      }

      // 5. Sync Suppliers
      if (Array.isArray(remote.suppliers)) {
        const sRaw = localStorage.getItem("nunes:suppliers");
        const newRaw = JSON.stringify(remote.suppliers);
        if (sRaw !== newRaw) {
          localStorage.setItem("nunes:suppliers", newRaw);
          localStorage.setItem("nunes_suppliers", newRaw);
          updatedAny = true;
        }
      }

      if (updatedAny) {
        try {
          window.dispatchEvent(new CustomEvent("nunes:records-synced"));
          window.dispatchEvent(new CustomEvent("nunes:job-saved"));
        } catch {}

        try {
          const bc = new BroadcastChannel("nunes_workflow_bus");
          bc.postMessage({ type: "SYNC_UPDATED", timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      return {
        success: true,
        updated: updatedAny,
        pulled: {
          service_jobs: remote.service_jobs?.length || 0,
          purchasing_orders: remote.purchasing_orders?.length || 0,
          quotations: remote.quotations?.length || 0,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      clientSyncInFlight = null;
    }
  })();

  return clientSyncInFlight;
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
