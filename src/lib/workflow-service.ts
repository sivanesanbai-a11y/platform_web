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

export function getWorkflowAlerts(): WorkflowAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: WorkflowAlert[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Auto-synthesize return approval alerts from synced service jobs so cross-device sessions never miss MD approval!
    try {
      const jobsRaw = localStorage.getItem("nunes:service_jobs");
      if (jobsRaw) {
        const jobs = JSON.parse(jobsRaw);
        if (Array.isArray(jobs)) {
          for (const j of jobs) {
            const wf = j.workflow || {};
            const jId = String(j.id || j.jobNo);
            const jNo = String(j.jobNo || j.id);

            // If MD has approved price, ensure Priya's return approval alert is present
            if (
              (wf.stage === "PRICE_APPROVED_BY_MD" || wf.mdApprovedPrice) &&
              !list.some((a) => (a.jobId === jId || a.jobNo === jNo) && a.stage === "PRICE_APPROVED_BY_MD")
            ) {
              const approvedAmt = Number(wf.mdApprovedPrice || wf.priyaTotalQuotationAmount || j.totals?.totalEstimate || 0);
              const isMod = Boolean(wf.mdPriceModified);
              const origAmt = Number(wf.originalQuotedPrice || approvedAmt);
              const titleMsg = isMod
                ? `✅ MD Adjusted & Approved ₹${approvedAmt.toLocaleString("en-IN")} (Orig: ₹${origAmt.toLocaleString("en-IN")}) for Job #${jNo}!`
                : `✅ MD Approved ₹${approvedAmt.toLocaleString("en-IN")} for Job #${jNo}!`;
              const bodyMsg = wf.mdReturnMessageToPriya || (isMod
                ? `MD adjusted and approved quotation price to ₹${approvedAmt.toLocaleString("en-IN")} (modified from Priya's quote of ₹${origAmt.toLocaleString("en-IN")}). Azhalaku Priya: Please fill courier/delivery details and send updated quotation.`
                : `MD approved quotation price ₹${approvedAmt.toLocaleString("en-IN")}. Azhalaku Priya: Please fill courier/delivery details and send quotation.`);

              list.unshift({
                id: `alert-auto-md-appr-${jId}`,
                jobId: jId,
                jobNo: jNo,
                customerName: j.customer?.name || "Customer",
                customerPhone: j.customer?.phone || "",
                customerCity: j.customer?.city || "Coimbatore",
                equipmentName: j.products?.[0]?.productName || "Equipment",
                equipmentModel: j.products?.[0]?.makeModel || "",
                serialNo: j.products?.[0]?.serialNo || "",
                fromUser: wf.mdApprovedBy || "MD (Managing Director)",
                targetRole: "PRIYA",
                targetNames: ["Azhalaku Priya", "azhalaku", "priya", "azhalakupriya@nunesinstruments.com"],
                stage: "PRICE_APPROVED_BY_MD",
                title: titleMsg,
                message: bodyMsg,
                amount: approvedAmt,
                createdAt: wf.mdApprovedAt || j.updatedAt || new Date().toISOString(),
                read: false,
                priority: "urgent",
              });
            }
          }
        }
      }
    } catch {}

    return list;
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
 * Filters alerts relevant to a particular logged in user or role.
 */
export function getAlertsForUser(currentUser: string): WorkflowAlert[] {
  const user = (currentUser || "").toLowerCase();
  const all = getWorkflowAlerts();

  return all.filter((alert) => {
    if (alert.targetRole === "ALL") return true;

    // Senthil alerts
    if (alert.targetRole === "SENTHIL" && (user.includes("senthil") || user.startsWith("senthil"))) {
      return true;
    }

    // MD alerts
    if (
      alert.targetRole === "MD" &&
      (user.includes("md") ||
        user.includes("admin") ||
        user.includes("director") ||
        user.includes("managing") ||
        user.includes("nunesinstruments@gmail.com"))
    ) {
      return true;
    }

    // Aravindh alerts
    if (alert.targetRole === "ARAVINDH" && (user.includes("aravind") || user.includes("aravindh"))) {
      return true;
    }

    // Return message from MD to Azhalaku Priya (PRICE_APPROVED_BY_MD) or any Priya target
    // Priya must ALWAYS receive this return message!
    if (
      alert.stage === "PRICE_APPROVED_BY_MD" ||
      alert.targetRole === "PRIYA"
    ) {
      if (
        user.includes("priya") ||
        user.includes("azhalaku") ||
        user.includes("commercial") ||
        user.includes("quotation") ||
        user.includes("admin") ||
        user.includes("md") ||
        !user ||
        (typeof window !== "undefined" && window.location.pathname.startsWith("/quotations"))
      ) {
        return true;
      }
    }

    // Front Office & Service Intake (Suganya, Radha, Rekha, Sabitha, Azhalaku Priya, Senthil)
    if (alert.targetRole === "FRONT_OFFICE") {
      if (
        user.includes("suganya") ||
        user.includes("radha") ||
        user.includes("rekha") ||
        user.includes("sabitha") ||
        user.includes("priya") ||
        user.includes("azhalaku") ||
        user.includes("senthil") ||
        user.includes("admin") ||
        user.includes("md") ||
        !user
      ) {
        return true;
      }
    }

    if (alert.targetNames && alert.targetNames.some((n) => {
      const nLower = n.toLowerCase();
      const uPrefix = user.split('@')[0];
      return user.includes(nLower) || nLower.includes(uPrefix) || uPrefix.includes(nLower);
    })) {
      return true;
    }

    // If user is Admin or MD, they can see all alerts
    if (
      user.includes("admin") ||
      user === "md" ||
      user.startsWith("md@") ||
      user.includes("director") ||
      user.includes("managing") ||
      user.includes("nunesinstruments@gmail.com")
    ) {
      return true;
    }

    return false;
  });
}
