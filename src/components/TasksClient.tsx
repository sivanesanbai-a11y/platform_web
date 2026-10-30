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

export default function TasksClient() {
  const params = useSearchParams();
  const initial = params.get("source");
  const [source, setSource] = useState(
    initial === "purchasing" || initial === "servicing" ? initial : "all"
  );
  const [filter, setFilter] = useState<"active" | "waiting" | "attention">("active");
  const [q, setQ] = useState("");
  const [data, setData] = useState<TasksPayload | null>(null);

  const load = () => {
    void syncPullFromCloud();
    getTasks(true).then(setData);
  };

  useEffect(() => {
    load();
    const handleSync = () => load();
    window.addEventListener("nunes:records-synced", handleSync);
    const t = setInterval(load, 15000);
    return () => {
      clearInterval(t);
      window.removeEventListener("nunes:records-synced", handleSync);
    };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    let a: TaskItem[] = [
      ...(source !== "servicing" ? data.purchasing : []),
      ...(source !== "purchasing" ? data.servicing : []),
    ];
    if (filter === "waiting") a = a.filter((x) => x.waiting_hours >= 2);
    if (filter === "attention") a = a.filter((x) => x.needs_attention);
    const s = q.trim().toLowerCase();
    if (s) a = a.filter((x) => JSON.stringify(x).toLowerCase().includes(s));
    return a.sort(
      (a, b) =>
        (b.needs_attention ? 1 : 0) - (a.needs_attention ? 1 : 0) ||
        b.waiting_hours - a.waiting_hours
    );
  }, [data, source, filter, q]);

  if (!data)
    return (
      <main className="p-8 flex items-center justify-center min-h-[60vh]">
        <CylindricalLoader text="LOADING" />
      </main>
    );

  const activeCount = data.summary.active || 0;
  const waitingCount = data.summary.waiting || 0;
  const attentionCount = data.summary.needs_attention || 0;
  const completedCount = data.summary.completed_today || 0;

  return (
    <main className="w-full p-4 md:p-6 space-y-5 font-sans">
      <div className="task-summary">
        <div>
          <Clock3 />
          <span>
            <b>{activeCount}</b>Active tasks
          </span>
        </div>
        <div>
          <Clock3 />
          <span>
            <b>{waitingCount}</b>Waiting action
          </span>
        </div>
        <div className="danger">
          <AlertTriangle />
          <span>
            <b>{attentionCount}</b>Needs attention
          </span>
        </div>
        <div className="good">
          <CheckCircle2 />
          <span>
            <b>{completedCount}</b>Completed today
          </span>
        </div>
      </div>

      <div className="filter-toolbar">
        <div className="tabs">
          <button
            className={source === "all" ? "active" : ""}
            onClick={() => setSource("all")}
          >
            All
          </button>
          <button
            className={source === "purchasing" ? "active" : ""}
            onClick={() => setSource("purchasing")}
          >
            Purchasing
          </button>
          <button
            className={source === "servicing" ? "active" : ""}
            onClick={() => setSource("servicing")}
          >
            Servicing
          </button>
        </div>
        <div className="tabs">
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={filter === "waiting" ? "active" : ""}
            onClick={() => setFilter("waiting")}
          >
            Waiting
          </button>
          <button
            className={filter === "attention" ? "active" : ""}
            onClick={() => setFilter("attention")}
          >
            Needs attention
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
            <TaskCard key={`${x.source}-${x.id}`} item={x} />
          ))
        ) : (
          <div className="empty large-empty">
            <CheckCircle2 />
            <b>No tasks match this view</b>
            <span>Change the source or status filter.</span>
          </div>
        )}
      </div>
    </main>
  );
}

function TaskCard({ item: x }: { item: TaskItem }) {
  return (
    <article className={`task-card ${x.needs_attention ? "attention" : ""}`}>
      <div className={`task-source ${x.source}`}>
        {x.source === "purchasing" ? "P" : "S"}
      </div>
      <div className="task-main">
        <div className="task-title-row">
          <div>
            <span className="source-badge-wrap">
              <span className={`source-badge ${x.source}`}>
                {x.source === "purchasing" ? "Purchasing" : "Servicing"}
              </span>
              <span className={`priority ${x.priority.toLowerCase()}`}>
                {x.priority} priority
              </span>
            </span>
            <h3>
              {x.record_no} · {x.customer}
            </h3>
            {x.product && <p>{x.product}</p>}
          </div>
          <Link href={x.action_path} className="btn primary">
            Continue <ArrowRight />
          </Link>
        </div>
        <div className="task-meta">
          <div>
            <span>Current step</span>
            <b>{x.current_stage}</b>
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
            <b>{x.waiting_hours}h</b>
          </div>
        </div>
        <div className="task-progress">
          <div>
            <span>Progress</span>
            <b>{x.progress}%</b>
          </div>
          <div className="stage-track">
            <span
              className={x.source === "servicing" ? "teal" : ""}
              style={{ width: `${x.progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
