import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

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
  { email: "rekha@nunesinstruments.com", password: "rekha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "rekha", password: "rekha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "sabitha@nunesinstruments.com", password: "sabitha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "sabitha", password: "sabitha@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "azhalakupriya@nunesinstruments.com", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "azhalakupriya", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "priya", password: "priya@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "aravindh@nunesinstruments.com", password: "aravindh@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "aravindh", password: "aravindh@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "md@nunesinstruments.com", password: "md@nunes2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "md", password: "md@nunes2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "admin@nunes.com", password: "admin123", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "admin", password: "admin123", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "instruasia@gmail.com", password: "instruasia@2026", createdAt: "2026-10-23T06:00:00.000Z" },
  { email: "instruasia", password: "instruasia@2026", createdAt: "2026-10-23T06:00:00.000Z" },
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
  // In Vercel serverless /tmp is writable; locally ./data is writable
  if (process.env.VERCEL) {
    return path.join("/tmp", "nunes_cloud_store.json");
  }
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
  try {
    const filePath = getStoreFilePath();
    let raw = "";
    if (fs.existsSync(filePath)) {
      raw = fs.readFileSync(filePath, "utf8");
    } else {
      const seedPath = path.join(process.cwd(), "data", "nunes_cloud_store.json");
      if (fs.existsSync(seedPath)) {
        raw = fs.readFileSync(seedPath, "utf8");
        try {
          fs.writeFileSync(filePath, raw, "utf8");
        } catch {}
      }
    }
    if (raw && raw.trim()) {
      const parsed = JSON.parse(raw);
      const existingUsers: AuthUserRecord[] = Array.isArray(parsed.users) ? parsed.users : [];
      for (const u of existingUsers) {
        if (!loadedUsers.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
          loadedUsers.push(u);
        }
      }
      return {
        service_jobs: Array.isArray(parsed.service_jobs) ? parsed.service_jobs : [],
        purchasing_orders: Array.isArray(parsed.purchasing_orders) ? parsed.purchasing_orders : [],
        quotations: Array.isArray(parsed.quotations) ? parsed.quotations : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
        users: loadedUsers,
        last_updated: parsed.last_updated || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn("Failed reading store file, using in-memory baseline:", e);
  }

  return {
    service_jobs: [],
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
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
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

export async function refreshServerStoreFromCloud(): Promise<NunesStoreData> {
  const store = getServerStore();
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
      }
    }
  } catch (e: any) {
    console.warn("Could not pull from Vercel Blob store:", e.message);
  }
  return store;
}

export function getServerStore(): NunesStoreData {
  if (!globalThis.__NUNES_STORE__) {
    globalThis.__NUNES_STORE__ = loadFromDisk();
  }
  return globalThis.__NUNES_STORE__;
}

export async function upsertServiceJobAsync(job: ServiceJobRecord): Promise<void> {
  const store = await refreshServerStoreFromCloud();
  const idStr = String(job.id || job.jobNo || `SJ-${Date.now()}`);
  const jobNoStr = String(job.jobNo || job.id || idStr);
  const normalized = { ...job, id: idStr, jobNo: jobNoStr, updatedAt: new Date().toISOString() };
  
  const idx = store.service_jobs.findIndex(
    (x) => String(x.id) === idStr || String(x.jobNo) === jobNoStr
  );
  if (idx >= 0) {
    store.service_jobs[idx] = { ...store.service_jobs[idx], ...normalized };
  } else {
    store.service_jobs.unshift(normalized);
  }
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  await pushToRemoteCloudStore(store);
}

export async function upsertPurchasingOrderAsync(order: PurchasingOrderRecord): Promise<void> {
  const store = await refreshServerStoreFromCloud();
  const idStr = String(order.id || order.order_id || `NM-${Date.now()}`);
  const orderIdStr = String(order.order_id || order.id || idStr);
  const normalized = { ...order, id: idStr, order_id: orderIdStr, updated_at: new Date().toISOString() };

  const idx = store.purchasing_orders.findIndex(
    (x) => String(x.id) === idStr || String(x.order_id) === orderIdStr
  );
  if (idx >= 0) {
    store.purchasing_orders[idx] = { ...store.purchasing_orders[idx], ...normalized };
  } else {
    store.purchasing_orders.unshift(normalized);
  }
  store.last_updated = new Date().toISOString();
  saveToDisk(store);
  await pushToRemoteCloudStore(store);
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
