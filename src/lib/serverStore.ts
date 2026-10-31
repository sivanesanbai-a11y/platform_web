import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { DEFAULT_OPERATIONAL_JOBS } from "@/lib/service-defaults";

export interface ServiceJobRecord {
  id: string;
  jobNo: string;
  customer?: { name?: string; contactPerson?: string; phone?: string; email?: string; city?: string };
  products?: any[];
  status?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface PurchasingOrderRecord {
  id: string;
  order_id: string;
  customer_name?: string;
  marketing_items?: any[];
  status?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface QuotationStoreRecord {
  id: string;
  quotation_no: string;
  customer_name: string;
  customer_phone?: string;
  customer_city?: string;
  item_description: string;
  scope_type: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  sent_at: string;
  valid_until: string;
  notes?: string;
}

export interface AuthUserRecord {
  email: string;
  password: string;
  createdAt: string;
}

export const DEFAULT_COMPANY_USERS: AuthUserRecord[] = [
  { email: "suganya@nunesinstruments.com", password: "suganya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "suganya", password: "suganya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "radha@nunesinstruments.com", password: "radha@2026", createdAt: "2026-10-24T06:00:00.000Z" },
  { email: "radha", password: "radha@2026", createdAt: "2026-10-24T06:00:00.000Z" },
  { email: "rekha@nunesinstruments.com", password: "rekha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "rekha", password: "rekha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "sabitha@nunesinstruments.com", password: "sabitha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "sabitha", password: "sabitha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "azhalakupriya@nunesinstruments.com", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "azhalakupriya", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "priya", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "senthil@nunesinstruments.com", password: "senthil@2026", createdAt: "2026-10-24T06:00:00.000Z" },
  { email: "senthil", password: "senthil@2026", createdAt: "2026-10-24T06:00:00.000Z" },
  { email: "aravindh@nunesinstruments.com", password: "aravindh@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "aravindh", password: "aravindh@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "md@nunesinstruments.com", password: "md@nunes2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "md", password: "md@nunes2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "admin@nunes.com", password: "admin123", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "admin", password: "admin123", createdAt: "2026-10-23T06:00:00.000Z" },
];

export interface NunesStoreData {
  service_jobs: ServiceJobRecord[];
  purchasing_orders: PurchasingOrderRecord[];
  quotations: QuotationStoreRecord[];
  customers: any[];
  suppliers: any[];
  users: AuthUserRecord[];
  last_updated: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __NUNES_STORE__: NunesStoreData | undefined;
}

function getStoreFilePath(): string {
  const localDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch {}
  }
  return path.join(localDir, "nunes_cloud_store.json");
}

function loadFromDisk(): NunesStoreData {
  let loadedUsers: AuthUserRecord[] = [...DEFAULT_COMPANY_USERS];
  const serviceJobsMap = new Map<string, any>();
  const ordersMap = new Map<string, any>();
  const quotationsMap = new Map<string, any>();
  let customers: any[] = [];
  let suppliers: any[] = [];
  let lastUpdated = new Date().toISOString();

  // Seed baseline defaults
  for (const j of DEFAULT_OPERATIONAL_JOBS) {
    serviceJobsMap.set(String(j.id || j.jobNo), j);
  }

  const mergeStoreObject = (parsed: any) => {
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.last_updated && parsed.last_updated > lastUpdated) {
      lastUpdated = parsed.last_updated;
    }
    if (Array.isArray(parsed.users)) {
      for (const u of parsed.users) {
        if (!loadedUsers.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
          loadedUsers.push(u);
        }
      }
    }
    if (Array.isArray(parsed.service_jobs)) {
      for (const j of parsed.service_jobs) {
        const key = String(j.id || j.jobNo);
        if (!key) continue;
        if (!serviceJobsMap.has(key)) {
          serviceJobsMap.set(key, j);
        } else {
          const prev = serviceJobsMap.get(key);
          // Preserve any non-empty fields
          serviceJobsMap.set(key, {
            ...prev,
            ...j,
            customer: { ...(prev.customer || {}), ...(j.customer || {}) },
            products: (j.products && j.products.length > 0 && j.products[0]?.productName) ? j.products : (prev.products || j.products),
            workflow: { ...(prev.workflow || {}), ...(j.workflow || {}) },
            totals: { ...(prev.totals || {}), ...(j.totals || {}) },
            dispatch: { ...(prev.dispatch || {}), ...(j.dispatch || {}) },
            signoff: { ...(prev.signoff || {}), ...(j.signoff || {}) },
            attachments: Array.from(new Set([...(prev.attachments || []), ...(j.attachments || [])])),
          });
        }
      }
    }
    if (Array.isArray(parsed.purchasing_orders)) {
      for (const o of parsed.purchasing_orders) {
        const key = String(o.id || o.order_id);
        if (!key) continue;
        ordersMap.set(key, { ...(ordersMap.get(key) || {}), ...o });
      }
    }
    if (Array.isArray(parsed.quotations)) {
      for (const q of parsed.quotations) {
        const key = String(q.id || q.quotation_no);
        if (!key) continue;
        quotationsMap.set(key, { ...(quotationsMap.get(key) || {}), ...q });
      }
    }
    if (Array.isArray(parsed.customers) && parsed.customers.length > customers.length) {
      customers = parsed.customers;
    }
    if (Array.isArray(parsed.suppliers) && parsed.suppliers.length > suppliers.length) {
      suppliers = parsed.suppliers;
    }
  };

  try {
    const dataDir = path.join(process.cwd(), "data");
    const primaryFile = path.join(dataDir, "nunes_cloud_store.json");
    const masterBackupFile = path.join(dataDir, "nunes_cloud_store_MASTER_BACKUP.json");

    // 1. Read Master Backup if present (fail-safe indestructible copy)
    if (fs.existsSync(masterBackupFile)) {
      try {
        const rawMaster = fs.readFileSync(masterBackupFile, "utf8");
        if (rawMaster.trim()) mergeStoreObject(JSON.parse(rawMaster));
      } catch {}
    }

    // 2. Read Primary File
    if (fs.existsSync(primaryFile)) {
      const raw = fs.readFileSync(primaryFile, "utf8");
      if (raw.trim()) mergeStoreObject(JSON.parse(raw));
    }

    // 3. Check for any backups in data/backups/ to recover any historical jobs
    const backupDir = path.join(dataDir, "backups");
    if (fs.existsSync(backupDir)) {
      try {
        const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json")).sort();
        if (files.length > 0) {
          const latestBackup = path.join(backupDir, files[files.length - 1]);
          const rawB = fs.readFileSync(latestBackup, "utf8");
          if (rawB.trim()) mergeStoreObject(JSON.parse(rawB));
        }
      } catch {}
    }

    return {
      service_jobs: Array.from(serviceJobsMap.values()),
      purchasing_orders: Array.from(ordersMap.values()),
      quotations: Array.from(quotationsMap.values()),
      customers,
      suppliers,
      users: loadedUsers,
      last_updated: lastUpdated,
    };
  } catch (e) {
    console.warn("Failed reading store file, using in-memory baseline:", e);
  }

  return {
    service_jobs: [...DEFAULT_OPERATIONAL_JOBS],
    purchasing_orders: [],
    quotations: [],
    customers: [],
    suppliers: [],
    users: loadedUsers,
    last_updated: new Date().toISOString(),
  };
}

function saveToDisk(data: NunesStoreData): void {
  try {
    const filePath = getStoreFilePath();
    const dataDir = path.dirname(filePath);
    const content = JSON.stringify(data, null, 2);

    // 1. Write Primary File
    fs.writeFileSync(filePath, content, "utf8");

    // 2. Master permanent indestructible backup
    const masterBackupPath = path.join(dataDir, "nunes_cloud_store_MASTER_BACKUP.json");
    fs.writeFileSync(masterBackupPath, content, "utf8");

    // 3. Historical Rotating Backups
    const backupDir = path.join(dataDir, "backups");
    if (!fs.existsSync(backupDir)) {
      try {
        fs.mkdirSync(backupDir, { recursive: true });
      } catch {}
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `nunes_store_${timestamp}.json`);
    fs.writeFileSync(backupFile, content, "utf8");

    // Keep up to 60 historical snapshots
    try {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json")).sort();
      if (files.length > 60) {
        files.slice(0, files.length - 60).forEach((oldFile) => {
          try {
            fs.unlinkSync(path.join(backupDir, oldFile));
          } catch {}
        });
      }
    } catch {}
  } catch (e) {
    console.warn("Failed saving store to disk:", e);
  }
}

export const VERCEL_BLOB_PUBLIC_URL = "https://7ne1nlc0ugijs61k.public.blob.vercel-storage.com/nunes_cloud_store.json";

export async function pushToRemoteCloudStore(store: NunesStoreData): Promise<void> {
  try {
    const payload = {
      service_jobs: store.service_jobs,
      purchasing_orders: store.purchasing_orders,
      quotations: store.quotations,
      customers: store.customers,
      suppliers: store.suppliers,
      users: store.users,
      last_updated: store.last_updated,
    };
    await put("nunes_cloud_store.json", JSON.stringify(payload, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (e: any) {
    console.warn("Could not push to Vercel Blob store:", e.message);
  }
}

let lastCloudFetchTime = 0;
let cloudFetchInFlight: Promise<NunesStoreData> | null = null;
const CLOUD_CACHE_TTL_MS = 6000;

export async function refreshServerStoreFromCloud(): Promise<NunesStoreData> {
  const store = getServerStore();

  if (Date.now() - lastCloudFetchTime < CLOUD_CACHE_TTL_MS) {
    return store;
  }

  if (cloudFetchInFlight) {
    return cloudFetchInFlight;
  }

  cloudFetchInFlight = (async () => {
    try {
      const res = await fetch(VERCEL_BLOB_PUBLIC_URL, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      if (res.ok) {
        const d = await res.json();
        if (d) {
          if (Array.isArray(d.service_jobs)) {
            const map = new Map<string, any>();
            for (const item of DEFAULT_OPERATIONAL_JOBS) map.set(String(item.id || item.jobNo), item);
            for (const item of DEFAULT_OPERATIONAL_JOBS) map.set(String(item.id || item.jobNo), item);
            for (const item of store.service_jobs) map.set(String(item.id || item.jobNo), item);
            for (const item of d.service_jobs) map.set(String(item.id || item.jobNo), item);
            store.service_jobs = Array.from(map.values());
          }
          if (Array.isArray(d.purchasing_orders)) {
            const map = new Map<string, any>();
            for (const item of store.purchasing_orders) map.set(String(item.id || item.order_id), item);
            for (const item of d.purchasing_orders) map.set(String(item.id || item.order_id), item);
            store.purchasing_orders = Array.from(map.values());
          }
          if (Array.isArray(d.quotations)) {
            const map = new Map<string, any>();
            for (const item of store.quotations) map.set(String(item.id || item.quotation_no), item);
            for (const item of d.quotations) map.set(String(item.id || item.quotation_no), item);
            store.quotations = Array.from(map.values());
          }
          if (Array.isArray(d.users)) {
            for (const u of d.users) {
              if (!store.users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
                store.users.push(u);
              }
            }
          }
          store.last_updated = d.last_updated || new Date().toISOString();
          saveToDisk(store);
          lastCloudFetchTime = Date.now();
        }
      }
    } catch (e: any) {
      console.warn("Could not pull from Vercel Blob store:", e.message);
    } finally {
      cloudFetchInFlight = null;
    }
    return store;
  })();

  return cloudFetchInFlight;
}

export function getServerStore(): NunesStoreData {
  if (!globalThis.__NUNES_STORE__) {
    globalThis.__NUNES_STORE__ = loadFromDisk();
  }
  return globalThis.__NUNES_STORE__;
}

export async function purgeAllStoreDataAsync(): Promise<void> {
  const store = getServerStore();
  store.service_jobs = [...DEFAULT_OPERATIONAL_JOBS];
  store.purchasing_orders = [];
  store.quotations = [];
  store.customers = [];
  store.suppliers = [];
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  await pushToRemoteCloudStore(store);
}

export async function upsertServiceJobAsync(job: ServiceJobRecord): Promise<void> {
  const store = getServerStore();
  const idStr = String(job.id || job.jobNo || `SJ-${Date.now()}`);
  const jobNoStr = String(job.jobNo || job.id || idStr);
  const normalized = { ...job, id: idStr, jobNo: jobNoStr, updatedAt: new Date().toISOString() };
  
  const idx = store.service_jobs.findIndex(
    (x) => String(x.id) === idStr || String(x.jobNo) === jobNoStr
  );
  if (idx >= 0) {
    const existing = store.service_jobs[idx];
    store.service_jobs[idx] = {
      ...existing,
      ...normalized,
      customer: { ...(existing.customer || {}), ...(normalized.customer || {}) },
      products: (normalized.products && normalized.products.length > 0 && normalized.products[0]?.productName) ? normalized.products : (existing.products || normalized.products),
      workflow: { ...(existing.workflow || {}), ...(normalized.workflow || {}) },
      totals: { ...(existing.totals || {}), ...(normalized.totals || {}) },
      dispatch: { ...(existing.dispatch || {}), ...(normalized.dispatch || {}) },
      signoff: { ...(existing.signoff || {}), ...(normalized.signoff || {}) },
      attachments: Array.from(new Set([...(existing.attachments || []), ...(normalized.attachments || [])])),
    };
  } else {
    store.service_jobs.unshift(normalized);
  }
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  void pushToRemoteCloudStore(store);
}

export async function upsertPurchasingOrderAsync(order: PurchasingOrderRecord): Promise<void> {
  const store = getServerStore();
  const idStr = String(order.id || order.order_id || `NM-${Date.now()}`);
  const orderIdStr = String(order.order_id || order.id || idStr);
  const normalized = { ...order, id: idStr, order_id: orderIdStr, updated_at: new Date().toISOString() };

  const idx = store.purchasing_orders.findIndex(
    (x) => String(x.id) === idStr || String(x.order_id) === orderIdStr
  );
  if (idx >= 0) {
    const existing = store.purchasing_orders[idx];
    store.purchasing_orders[idx] = {
      ...existing,
      ...normalized,
      marketing_items: (normalized.marketing_items && normalized.marketing_items.length > 0) ? normalized.marketing_items : (existing.marketing_items || normalized.marketing_items),
      totals: { ...(existing.totals || {}), ...(normalized.totals || {}) },
    };
  } else {
    store.purchasing_orders.unshift(normalized);
  }
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  void pushToRemoteCloudStore(store);
}

export async function upsertQuotationAsync(quotation: QuotationStoreRecord): Promise<void> {
  const store = await refreshServerStoreFromCloud();
  const idStr = String(quotation.id || quotation.quotation_no || `qt-${Date.now()}`);
  const qNoStr = String(quotation.quotation_no || quotation.id || idStr);
  const normalized = { ...quotation, id: idStr, quotation_no: qNoStr };

  const idx = store.quotations.findIndex(
    (x) => String(x.id) === idStr || String(x.quotation_no) === qNoStr
  );
  if (idx >= 0) {
    store.quotations[idx] = { ...store.quotations[idx], ...normalized };
  } else {
    store.quotations.unshift(normalized);
  }
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  await pushToRemoteCloudStore(store);
}

export async function upsertAuthUserAsync(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const store = await refreshServerStoreFromCloud();
  const cleanEmail = email.trim().toLowerCase();
  const existing = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: "User already exists" };
  }
  store.users.push({
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
  });
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  await pushToRemoteCloudStore(store);
  return { success: true };
}

export function upsertServiceJob(job: ServiceJobRecord): void {
  void upsertServiceJobAsync(job);
}

export function upsertPurchasingOrder(order: PurchasingOrderRecord): void {
  void upsertPurchasingOrderAsync(order);
}

export function upsertQuotation(quotation: QuotationStoreRecord): void {
  void upsertQuotationAsync(quotation);
}

export function upsertAuthUser(email: string, password: string): { success: boolean; error?: string } {
  void upsertAuthUserAsync(email, password);
  return { success: true };
}

export function verifyAuthUser(email: string, password: string): boolean {
  const store = getServerStore();
  const cleanEmail = email.trim().toLowerCase();
  const found = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) return false;
  return found.password === password;
}
