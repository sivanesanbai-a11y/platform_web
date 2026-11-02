import { WorkflowStage } from "@/types/service-job";

export interface WorkflowAlert {
  id: string;
  jobId: string;
  jobNo: string;
  customerName: string;
  customerPhone?: string;
  customerCity?: string;
  equipmentName: string;
  equipmentModel?: string;
  serialNo?: string;
  scope?: string;
  fromUser: string;
  targetRole: "SENTHIL" | "MD" | "FRONT_OFFICE" | "ARAVINDH" | "PRIYA" | "ALL";
  targetNames?: string[];
  stage: WorkflowStage;
  title: string;
  message: string;
  amount?: number;
  createdAt: string;
  read: boolean;
  priority?: "urgent" | "normal" | "success";
}

const STORAGE_KEY = "nunes:workflow_alerts";

// Cross-tab broadcast channel
let workflowChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    workflowChannel = new BroadcastChannel("nunes_workflow_channel");
  } catch {}
}

/**
 * Returns genuine, dispatched workflow alerts.
 * Pure real-time notification engine: no synthetic/fake alerts.
 */
export function getWorkflowAlerts(): WorkflowAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: WorkflowAlert[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Filter out any stale auto-synthesized fake alerts
    const cleaned = list.filter((a) => a && typeof a === "object" && a.id && !a.id.startsWith("alert-auto-"));
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return [];
  }
}

export function saveWorkflowAlerts(alerts: WorkflowAlert[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 60)));
    window.dispatchEvent(new CustomEvent("nunes:workflow-alerts-updated"));
    if (workflowChannel) {
      try {
        workflowChannel.postMessage({ type: "alerts-updated" });
      } catch {}
    }
  } catch {}
}

export function clearAllWorkflowAlerts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("nunes:workflow-alerts-updated"));
    if (workflowChannel) {
      try {
        workflowChannel.postMessage({ type: "alerts-updated" });
      } catch {}
    }
  } catch {}
}

export function dispatchWorkflowAlert(
  data: Omit<WorkflowAlert, "id" | "createdAt" | "read">
): WorkflowAlert {
  const newAlert: WorkflowAlert = {
    ...data,
    id: `alert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const current = getWorkflowAlerts();
  const updated = [newAlert, ...current].slice(0, 60);
  saveWorkflowAlerts(updated);

  // Broadcast immediate popup notification event locally
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("nunes:workflow-notification", { detail: newAlert })
      );
    } catch {}
  }

  // Broadcast across tabs via BroadcastChannel
  if (workflowChannel) {
    try {
      workflowChannel.postMessage({ type: "notification", alert: newAlert });
    } catch {}
  }

  return newAlert;
}

export function markAlertRead(id: string): void {
  const current = getWorkflowAlerts();
  const updated = current.map((a) => (a.id === id ? { ...a, read: true } : a));
  saveWorkflowAlerts(updated);
}

export function markAllAlertsRead(): void {
  const current = getWorkflowAlerts();
  const updated = current.map((a) => ({ ...a, read: true }));
  saveWorkflowAlerts(updated);
}

/**
 * Filters alerts strictly relevant to a particular logged-in staff member or role.
 * Accurately prevents cross-role alert bleed so MD does not receive Priya's return notifications.
 */
export function getAlertsForUser(currentUser: string): WorkflowAlert[] {
  const user = (currentUser || "").toLowerCase().trim();
  const all = getWorkflowAlerts();
  if (!user) return [];

  const isAdmin = user.includes("admin");
  const isMd = !isAdmin && (user === "md" || user.startsWith("md@") || user.includes("director") || user.includes("managing") || user.includes("nunesinstruments@gmail.com"));
  const isPriya = user.includes("priya") || user.includes("azhalaku") || user.includes("commercial");
  const isSenthil = user.includes("senthil");
  const isAravindh = user.includes("aravind");
  const isFrontOffice = user.includes("suganya") || user.includes("radha") || user.includes("rekha") || user.includes("sabitha") || user.includes("front_office");

  return all.filter((alert) => {
    // Alerts broadcast to all stations
    if (alert.targetRole === "ALL") return true;

    // Direct name match in targetNames
    if (alert.targetNames && alert.targetNames.some((n) => {
      const nLower = n.toLowerCase();
      const uPrefix = user.split("@")[0];
      return user.includes(nLower) || nLower.includes(uPrefix) || uPrefix.includes(nLower);
    })) {
      return true;
    }

    // Role-specific routing
    if (alert.targetRole === "MD") {
      return isMd || isAdmin;
    }

    if (alert.targetRole === "PRIYA" || alert.stage === "PRICE_APPROVED_BY_MD") {
      return isPriya || (isAdmin && !isMd);
    }

    if (alert.targetRole === "SENTHIL") {
      return isSenthil || (isAdmin && !isMd);
    }

    if (alert.targetRole === "ARAVINDH") {
      return isAravindh || (isAdmin && !isMd);
    }

    if (alert.targetRole === "FRONT_OFFICE") {
      return isFrontOffice || (isAdmin && !isMd);
    }

    if (isAdmin) {
      return true;
    }

    return false;
  });
}
