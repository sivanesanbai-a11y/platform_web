"use client";

import CylindricalLoader from "@/components/CylindricalLoader";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  UserRound,
} from "lucide-react";
import { getTasks, relativeTime } from "@/lib/data";
import { syncPullFromCloud } from "@/lib/sync";
import type { TaskItem, TasksPayload } from "@/lib/types";

function serviceJobToTaskItem(job: any): TaskItem {
  const jobNo = String(job.jobNo || job.id || "JOB-NEW");
  const stage = String(job.workflow?.stage || "INTAKE_RECEIVED");
  const isCompleted = Boolean(
    job.status === "CLOSED" ||
    job.status === "READY" ||
    job.status === "COMPLETED" ||
    stage === "JOB_COMPLETED" ||
    job.workflow?.finalHandoverCompletedAt
  );

  const lastTime = job.updatedAt || job.createdAt || new Date().toISOString();
  const diffHours = Math.max(0, Math.floor((Date.now() - new Date(lastTime).getTime()) / (1000 * 60 * 60)));

  let progress = 15;
  if (isCompleted || stage === "JOB_COMPLETED") progress = 100;
  else if (stage === "READY_FOR_HANDOVER") progress = 95;
  else if (stage === "PRICE_APPROVED_BY_MD") progress = 90;
  else if (stage === "AWAITING_MD_APPROVAL") progress = 85;
  else if (stage === "AWAITING_PRIYA_PRICING") progress = 70;
  else if (stage === "UNDER_REPAIR_ARAVINDH" || stage === "UNDER_REPAIR_SENTHIL" || job.status === "REPAIRING") progress = 55;
  else if (stage === "AWAITING_ARAVINDH_ACCEPT") progress = 35;
  else if (stage === "INTAKE_RECEIVED") progress = 20;

  let responsible_team = "Branch Intake Team";
  let assigned_to = job.createdBy || job.workflow?.intakeStaffName || "Intake Staff";
  if (isCompleted) {
    responsible_team = "Delivered / Handover Complete";
    assigned_to = job.workflow?.handoverHandledBy || job.signoff?.inspectedBy || "Front Office";
  } else if (stage === "AWAITING_MD_APPROVAL") {
    responsible_team = "Executive Management (MD)";
    assigned_to = "Managing Director (MD)";
  } else if (stage === "AWAITING_PRIYA_PRICING" || stage === "READY_FOR_HANDOVER") {
    responsible_team = "Commercial Front Office";
    assigned_to = "Azhalaku Priya";
  } else if (stage === "UNDER_REPAIR_SENTHIL") {
    responsible_team = "Main Service Workshop";
    assigned_to = job.workflow?.mechanicAssigned || "Senthil Kumar";
  } else if (stage === "AWAITING_ARAVINDH_ACCEPT" || stage === "UNDER_REPAIR_ARAVINDH") {
    responsible_team = "Workshop & Logistics";
    assigned_to = "Aravindh";
  }

  const needsAttention = !isCompleted && (
    stage === "AWAITING_MD_APPROVAL" ||
    stage === "AWAITING_PRIYA_PRICING" ||
    stage === "AWAITING_ARAVINDH_ACCEPT" ||
    diffHours >= 4
  );

  const productDesc = (job.products || [])
    .map((p: any) => p.productName ? `${p.productName}${p.makeModel ? ` (${p.makeModel})` : ""}` : "")
    .filter(Boolean)
    .join(", ") || (job.customFormName ? job.customFormName : "Service Equipment");

  const branchName = job.workflow?.isBranchDelivery || (job.createdBy || "").toLowerCase().includes("suganya") || (job.createdBy || "").toLowerCase().includes("radha")
    ? "Branch Office"
    : "Main Office";

  return {
    id: String(job.id || jobNo),
    source: "servicing",
    record_no: jobNo,
    customer: job.customer?.name || "Customer",
    product: productDesc,
    branch: branchName,
    current_stage: stage.replace(/_/g, " "),
    status: isCompleted ? "COMPLETED" : (job.status || "RECEIVED"),
    progress,
    responsible_team,
    assigned_to,
    priority: needsAttention ? "High" : "Normal",
    updated_at: lastTime,
    waiting_hours: diffHours,
    needs_attention: needsAttention,
    action_path: `/forms/servicing?job=${encodeURIComponent(jobNo)}`,
    is_completed: isCompleted,
  };
}

function purchasingOrderToTaskItem(o: any): TaskItem {
  const isDone = o.current_status === "Delivered" || o.current_status === "Closed" || o.current_status === "Completed";
  return {
    id: String(o.order_id || o.id),
    source: "purchasing",
    record_no: String(o.order_id || o.id),
    customer: o.customer_name || "Customer",
    product: (o.marketing_items || []).map((m: any) => m.item_name).filter(Boolean).join(", ") || "Purchasing Order",
    branch: o.branch || "Head Office",
    current_stage: (o.current_stage || o.current_status || "In Progress").replace(/_/g, " "),
    status: isDone ? "COMPLETED" : (o.current_status || "ACTIVE"),
    progress: isDone ? 100 : 50,
    responsible_team: "Procurement & Dispatch",
    assigned_to: o.created_by || "Procurement Team",
    priority: "Normal",
    updated_at: o.updated_at || new Date().toISOString(),
    waiting_hours: 0,
    needs_attention: false,
    action_path: `/forms/purchasing?order=${encodeURIComponent(String(o.order_id || o.id))}`,
    is_completed: isDone,
  };
}

export default function TasksClient() {
  const params = useSearchParams();
  const [source, setSource] = useState("servicing");
  const [filter, setFilter] = useState<"all" | "active" | "waiting" | "attention" | "completed">("active");
  const [q, setQ] = useState("");
  const [data, setData] = useState<TasksPayload | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [localServicingTasks, setLocalServicingTasks] = useState<TaskItem[]>([]);

  const load = () => {
    void syncPullFromCloud();
    getTasks(true).then(setData);
    try {
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) setUserEmail(parsed.email);
      }
    } catch {}

    try {
      const rawJobs = localStorage.getItem("nunes:service_jobs");
      const sList: any[] = rawJobs ? JSON.parse(rawJobs) : [];

      // Check current draft if not already in saved jobs list
      const rawDraft = localStorage.getItem("nunes:service_current_draft");
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (
          draft &&
          draft.customer?.name &&
          !sList.some((x) => String(x.id) === String(draft.id) || String(x.jobNo) === String(draft.jobNo))
        ) {
          sList.push({
            ...draft,
            status: "DRAFT_SAVED",
            jobNo: draft.jobNo || "DRAFT-ACTIVE",
          });
        }
      }
      setLocalServicingTasks(sList.map(serviceJobToTaskItem));
    } catch {}
  };

  useEffect(() => {
    load();
    const handleSync = () => load();
    window.addEventListener("nunes:records-synced", handleSync);
    window.addEventListener("nunes:job-saved", handleSync);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nunes:service_jobs" || e.key === "nunes:service_current_draft") {
        load();
      }
    };
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("nunes_workflow_channel");
      bc.onmessage = () => load();
    } catch {}

    const t = setInterval(load, 15000);
    return () => {
      clearInterval(t);
      window.removeEventListener("nunes:records-synced", handleSync);
      window.removeEventListener("nunes:job-saved", handleSync);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, []);

  const combinedServicing = useMemo(() => {
    const sMerged: TaskItem[] = [...localServicingTasks];
    const sSeen = new Set(localServicingTasks.map((t) => String(t.record_no || t.id).toLowerCase()));
    for (const item of (data?.servicing || [])) {
      if (!sSeen.has(String(item.record_no || item.id).toLowerCase())) {
        sMerged.push(item);
      }
    }
    return sMerged;
  }, [data, localServicingTasks]);

  const allFilteredBySource = combinedServicing;

  const activeCount = useMemo(() => {
    return allFilteredBySource.filter(
      (x) =>
        !x.is_completed &&
        x.status !== "COMPLETED" &&
        x.status !== "CLOSED" &&
        x.status !== "READY" &&
        !x.current_stage?.toLowerCase().includes("complete")
    ).length;
  }, [allFilteredBySource]);

  const waitingCount = useMemo(() => {
    return allFilteredBySource.filter(
      (x) =>
        !x.is_completed &&
        x.status !== "COMPLETED" &&
        x.waiting_hours >= 2
    ).length;
  }, [allFilteredBySource]);

  const attentionCount = useMemo(() => {
    return allFilteredBySource.filter(
      (x) =>
        !x.is_completed &&
        x.status !== "COMPLETED" &&
        x.needs_attention
    ).length;
  }, [allFilteredBySource]);

  const completedCount = useMemo(() => {
    return allFilteredBySource.filter(
      (x) =>
        x.is_completed ||
        x.status === "COMPLETED" ||
        x.status === "CLOSED" ||
        x.status === "READY" ||
        x.current_stage?.toLowerCase().includes("complete")
    ).length;
  }, [allFilteredBySource]);

  const rows = useMemo(() => {
    let a: TaskItem[] = [...allFilteredBySource];
    if (filter === "completed") {
      a = a.filter(
        (x) =>
          x.is_completed ||
          x.status === "COMPLETED" ||
          x.status === "CLOSED" ||
          x.status === "READY" ||
          x.current_stage?.toLowerCase().includes("complete")
      );
    } else if (filter === "active") {
      a = a.filter(
        (x) =>
          !x.is_completed &&
          x.status !== "COMPLETED" &&
          x.status !== "CLOSED" &&
          x.status !== "READY" &&
          !x.current_stage?.toLowerCase().includes("complete")
      );
    } else if (filter === "waiting") {
      a = a.filter(
        (x) =>
          !x.is_completed &&
          x.status !== "COMPLETED" &&
          x.waiting_hours >= 2
      );
    } else if (filter === "attention") {
      a = a.filter(
        (x) =>
          !x.is_completed &&
          x.status !== "COMPLETED" &&
          x.needs_attention
      );
    }

    const s = q.trim().toLowerCase();
    if (s) a = a.filter((x) => JSON.stringify(x).toLowerCase().includes(s));
    return a.sort(
      (a, b) =>
        (b.needs_attention ? 1 : 0) - (a.needs_attention ? 1 : 0) ||
        (b.is_completed ? -1 : 1) - (a.is_completed ? -1 : 1) ||
        b.waiting_hours - a.waiting_hours
    );
  }, [allFilteredBySource, filter, q]);

  if (!data && localServicingTasks.length === 0 && localPurchasingTasks.length === 0)
    return (
      <main className="p-8 flex items-center justify-center min-h-[60vh]">
        <CylindricalLoader text="LOADING" />
      </main>
    );

  return (
    <main className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Clickable KPI Tiles */}
      <div className="task-summary">
        <div
          onClick={() => setFilter("active")}
          style={{
            cursor: "pointer",
            border: filter === "active" ? "2px solid #2563eb" : undefined,
            borderRadius: "12px",
            background: filter === "active" ? "#eff6ff" : undefined,
          }}
          title="Click to view Active Tasks"
        >
          <Clock3 />
          <span>
            <b>{activeCount}</b>Active tasks
          </span>
        </div>
        <div
          onClick={() => setFilter("waiting")}
          style={{
            cursor: "pointer",
            border: filter === "waiting" ? "2px solid #2563eb" : undefined,
            borderRadius: "12px",
            background: filter === "waiting" ? "#eff6ff" : undefined,
          }}
          title="Click to view Waiting Tasks"
        >
          <Clock3 />
          <span>
            <b>{waitingCount}</b>Waiting action
          </span>
        </div>
        <div
          className="danger"
          onClick={() => setFilter("attention")}
          style={{
            cursor: "pointer",
            border: filter === "attention" ? "2px solid #dc2626" : undefined,
            borderRadius: "12px",
            background: filter === "attention" ? "#fef2f2" : undefined,
          }}
          title="Click to view Needs Attention Tasks"
        >
          <AlertTriangle />
          <span>
            <b>{attentionCount}</b>Needs attention
          </span>
        </div>
        <div
          className="good"
          onClick={() => setFilter("completed")}
          style={{
            cursor: "pointer",
            border: filter === "completed" ? "2px solid #16a34a" : undefined,
            borderRadius: "12px",
            background: filter === "completed" ? "#f0fdf4" : undefined,
          }}
          title="Click to view Completed Forms"
        >
          <CheckCircle2 />
          <span>
            <b>{completedCount}</b>Completed forms
          </span>
        </div>
      </div>

      <div className="filter-toolbar">
        <div className="tabs">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "#eef4ff",
              color: "#1d4ed8",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <Clock3 size={14} /> Service Work Queue
          </span>
        </div>

        <div className="tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({allFilteredBySource.length})
          </button>
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Active ({activeCount})
          </button>
          <button
            className={filter === "waiting" ? "active" : ""}
            onClick={() => setFilter("waiting")}
          >
            Waiting ({waitingCount})
          </button>
          <button
            className={filter === "attention" ? "active" : ""}
            onClick={() => setFilter("attention")}
          >
            Needs attention ({attentionCount})
          </button>
          <button
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
            style={{
              fontWeight: 800,
              color: filter === "completed" ? "#ffffff" : "#16a34a",
              background: filter === "completed" ? "#16a34a" : undefined,
            }}
          >
            ✓ Completed ({completedCount})
          </button>
        </div>

        <label className="toolbar-search">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search task, customer, worker, stage…"
          />
        </label>
      </div>

      <div className="task-list">
        {rows.length ? (
          rows.map((x) => (
            <TaskCard key={`${x.source}-${x.id}`} item={x} userEmail={userEmail} />
          ))
        ) : (
          <div className="empty large-empty">
            <CheckCircle2 />
            <b>No tasks match this view</b>
            <span>Change the source or status filter to see other records.</span>
          </div>
        )}
      </div>
    </main>
  );
}

function TaskCard({ item: x, userEmail }: { item: TaskItem; userEmail: string }) {
  const isDone = Boolean(
    x.is_completed ||
    x.status === "COMPLETED" ||
    x.status === "CLOSED" ||
    x.status === "READY" ||
    x.current_stage?.toLowerCase().includes("complete")
  );

  const emailLower = (userEmail || "").toLowerCase();
  let resolvedPath = x.action_path;
  if (!isDone) {
    if (emailLower.includes("aravind") || emailLower.includes("senthil")) {
      resolvedPath = "/workshop";
    } else if (emailLower.includes("priya") || emailLower.includes("azhalaku")) {
      resolvedPath = "/quotations";
    }
  }

  return (
    <article
      className={`task-card ${x.needs_attention && !isDone ? "attention" : ""}`}
      style={
        isDone
          ? {
              borderLeft: "5px solid #16a34a",
              background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
            }
          : undefined
      }
    >
      <div
        className="task-source servicing"
        style={isDone ? { background: "#16a34a", color: "#ffffff" } : undefined}
      >
        {isDone ? "✓" : "S"}
      </div>
      <div className="task-main">
        <div className="task-title-row">
          <div>
            <span className="source-badge-wrap">
              <span className="source-badge servicing">
                Servicing Job
              </span>
              {isDone ? (
                <span
                  className="priority"
                  style={{
                    background: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #86efac",
                    fontWeight: 800,
                  }}
                >
                  ✓ COMPLETED / ALL DONE
                </span>
              ) : (
                <span className={`priority ${x.priority.toLowerCase()}`}>
                  {x.priority} priority
                </span>
              )}
            </span>
            <h3>
              {x.record_no} · {x.customer}
            </h3>
            {x.product && <p>{x.product}</p>}
          </div>
          <Link
            href={resolvedPath}
            className="btn primary"
            style={
              isDone
                ? {
                    background: "#16a34a",
                    borderColor: "#15803d",
                    color: "#ffffff",
                    fontWeight: 800,
                  }
                : undefined
            }
          >
            {isDone ? "View Completed Form" : "Continue"} <ArrowRight />
          </Link>
        </div>
        <div className="task-meta">
          <div>
            <span>Current step</span>
            <b style={isDone ? { color: "#166534", fontWeight: 800 } : undefined}>
              {x.current_stage}
            </b>
          </div>
          <div>
            <span>Responsible team</span>
            <b>{x.responsible_team || "Not recorded"}</b>
          </div>
          <div>
            <span>Latest recorded person</span>
            <b>
              <UserRound />
              {x.assigned_to || "Not recorded"}
            </b>
          </div>
          <div>
            <span>Last update</span>
            <b>{relativeTime(x.updated_at)}</b>
          </div>
          <div>
            <span>Waiting</span>
            <b>{isDone ? "0h (Completed)" : `${x.waiting_hours}h`}</b>
          </div>
        </div>
        <div className="task-progress">
          <div>
            <span>Progress</span>
            <b style={isDone ? { color: "#166534", fontWeight: 800 } : undefined}>
              {isDone ? "100%" : `${x.progress}%`}
            </b>
          </div>
          <div className="stage-track">
            <span
              className={x.source === "servicing" ? "teal" : ""}
              style={{
                width: isDone ? "100%" : `${x.progress}%`,
                background: isDone ? "#16a34a" : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
