"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
  ArrowRight,
  X,
  Package,
  User,
  Truck,
  ShieldCheck,
  MailCheck,
} from "lucide-react";
import {
  WorkflowAlert,
  getWorkflowAlerts,
  getAlertsForUser,
  markAlertRead,
  markAllAlertsRead,
} from "@/lib/workflow-service";

function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export default function WorkflowNotificationManager() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [activeToast, setActiveToast] = useState<WorkflowAlert | null>(null);
  const [alerts, setAlerts] = useState<WorkflowAlert[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelContainerRef.current && !panelContainerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  const loadData = () => {
    try {
      const sessionRaw = localStorage.getItem("nunes_auth_session");
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        const identifier = [session?.email, session?.username, session?.displayName, session?.role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (identifier) setCurrentUser(identifier);
      }
      setAlerts(getWorkflowAlerts());
    } catch {}
  };

  useEffect(() => {
    loadData();

    // Listen for live broadcast alert
    const handleNotification = (e: CustomEvent<WorkflowAlert>) => {
      const alert = e.detail;
      if (alert) {
        playNotificationChime();
        setActiveToast(alert);
        loadData();
        // Auto-hide toast after 8 seconds
        setTimeout(() => {
          setActiveToast((prev) => (prev?.id === alert.id ? null : prev));
        }, 8000);
      }
    };

    const handleAlertsUpdated = () => {
      loadData();
    };

    // 1. Window Event Listeners
    window.addEventListener("nunes:workflow-notification", handleNotification as EventListener);
    window.addEventListener("nunes:workflow-alerts-updated", handleAlertsUpdated);
    window.addEventListener("nunes:records-synced", loadData);

    // 2. Cross-tab Storage Listener (triggers when another tab updates localStorage)
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes("workflow_alerts") || e.key.includes("service_jobs")) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Cross-tab Broadcast Channel (instant inter-tab notifications)
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("nunes_workflow_channel");
        channel.onmessage = (e) => {
          if (e.data?.type === "notification" && e.data?.alert) {
            handleNotification({ detail: e.data.alert } as any);
          } else if (e.data?.type === "alerts-updated") {
            loadData();
          }
        };
      } catch {}
    }

    // 4. Polling fallback every 10 seconds to ensure cross-device notifications land (throttled when tab is backgrounded)
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      loadData();
    }, 10000);

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("nunes:workflow-notification", handleNotification as EventListener);
      window.removeEventListener("nunes:workflow-alerts-updated", handleAlertsUpdated);
      window.removeEventListener("nunes:records-synced", loadData);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(pollInterval);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, []);

  const userAlerts = getAlertsForUser(currentUser);
  const unreadCount = userAlerts.filter((a) => !a.read).length;

  const handleOpenJob = (jobId: string, alertId?: string, alert?: WorkflowAlert) => {
    if (alertId) markAlertRead(alertId);
    setActiveToast(null);
    setPanelOpen(false);

    const user = currentUser.toLowerCase();

    // Specific check for Return Approval to Priya
    const isPriceApprovedAlert = alert?.stage === "PRICE_APPROVED_BY_MD";

    const isMdAlertOrUser =
      !isPriceApprovedAlert &&
      (user.includes("md") ||
        user.includes("admin") ||
        user.startsWith("director") ||
        user.includes("nunesinstruments@gmail.com") ||
        alert?.targetRole === "MD" ||
        alert?.stage === "AWAITING_MD_APPROVAL");

    const isPriyaUser =
      isPriceApprovedAlert ||
      alert?.targetRole === "PRIYA" ||
      user.includes("priya") ||
      user.includes("azhalaku") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/quotations"));

    const isSenthilUser =
      !isPriceApprovedAlert &&
      !isMdAlertOrUser &&
      !isPriyaUser &&
      (user.includes("senthil") || (alert?.targetRole === "SENTHIL" && !user.includes("aravind")));

    const isAravindhUser =
      !isPriceApprovedAlert &&
      !isMdAlertOrUser &&
      !isPriyaUser &&
      !isSenthilUser &&
      (user.includes("aravind") || alert?.targetRole === "ARAVINDH");

    const targetTab = isSenthilUser ? "repair" : isAravindhUser ? "verification" : undefined;
    const targetUrl = isPriceApprovedAlert || isPriyaUser
      ? `/quotations?job=${encodeURIComponent(jobId)}`
      : isMdAlertOrUser
      ? `/dashboard?job=${encodeURIComponent(jobId)}`
      : isSenthilUser
      ? `/workshop?job=${encodeURIComponent(jobId)}&tab=repair`
      : isAravindhUser
      ? `/workshop?job=${encodeURIComponent(jobId)}&tab=verification`
      : `/forms/servicing?id=${encodeURIComponent(jobId)}`;

    if (typeof window !== "undefined") {
      // 1. Dispatch custom event with job and tab details for instantaneous 0ms client-side opening
      window.dispatchEvent(
        new CustomEvent("nunes:select-job", {
          detail: { jobId, tab: targetTab, alert }
        })
      );

      // 2. If already on the target route (e.g. Priya already on /quotations), update history and dispatch popstate
      const currentPath = window.location.pathname;
      const targetPath = targetUrl.split("?")[0];
      if (currentPath === targetPath) {
        window.history.pushState({}, "", targetUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  return (
    <>
      {/* FLOATING REAL-TIME TOAST POPUP (TOP-RIGHT) */}
      {activeToast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 100000,
            maxWidth: "420px",
            width: "90%",
            background: "#ffffff",
            border: activeToast.stage === "PRICE_APPROVED_BY_MD" ? "2.5px solid #059669" : "2px solid #0f766e",
            borderRadius: "16px",
            boxShadow: activeToast.stage === "PRICE_APPROVED_BY_MD"
              ? "0 20px 40px -10px rgba(5, 150, 105, 0.45)"
              : "0 20px 40px -10px rgba(15, 118, 110, 0.35)",
            overflow: "hidden",
            animation: "slideInRight 0.35s ease-out",
          }}
        >
          {/* Toast Header */}
          <div
            style={{
              padding: "10px 14px",
              background:
                activeToast.stage === "PRICE_APPROVED_BY_MD"
                  ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
                  : activeToast.stage === "AWAITING_MD_APPROVAL"
                  ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                  : activeToast.stage === "AWAITING_ARAVINDH_ACCEPT"
                  ? "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)"
                  : activeToast.stage === "UNDER_REPAIR_ARAVINDH" || activeToast.stage === "UNDER_REPAIR_SENTHIL"
                  ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)"
                  : activeToast.stage === "READY_FOR_HANDOVER"
                  ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                  : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 800 }}>
              {activeToast.stage === "PRICE_APPROVED_BY_MD" && <MailCheck size={16} style={{ color: "#a7f3d0" }} />}
              {activeToast.stage === "AWAITING_MD_APPROVAL" && <Sparkles size={14} style={{ color: "#facc15" }} />}
              {activeToast.stage === "AWAITING_ARAVINDH_ACCEPT" && <Package size={14} />}
              {(activeToast.stage === "UNDER_REPAIR_ARAVINDH" || activeToast.stage === "UNDER_REPAIR_SENTHIL") && <Wrench size={14} />}
              {activeToast.stage === "READY_FOR_HANDOVER" && <CheckCircle2 size={14} />}
              {activeToast.stage === "INTAKE_RECEIVED" && <Package size={14} />}
              <span>{activeToast.stage === "PRICE_APPROVED_BY_MD" ? "📩 Return Message from MD" : activeToast.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Toast Body */}
          <div style={{ padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontWeight: 700, lineHeight: 1.45 }}>
              {activeToast.message}
            </p>

            {/* Structured Equipment & Customer Preview Card */}
            <div
              style={{
                marginTop: "10px",
                background: "#f8fafc",
                borderRadius: "10px",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>
                  📦 {activeToast.equipmentName} {activeToast.equipmentModel ? `(${activeToast.equipmentModel})` : ""}
                </span>
                {activeToast.serialNo && (
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#047857", background: "#dcfce7", padding: "1px 6px", borderRadius: "4px", fontSize: "10px" }}>
                    SN: {activeToast.serialNo}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", color: "#475569" }}>
                <span>
                  👤 <b>{activeToast.customerName}</b> {activeToast.customerPhone ? `• ${activeToast.customerPhone}` : ""} {activeToast.customerCity ? `(${activeToast.customerCity})` : ""}
                </span>
                <span style={{ color: "#64748b", fontWeight: 700 }}>
                  Job #{activeToast.jobNo}
                </span>
              </div>

              {(activeToast.scope || activeToast.amount) && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", fontWeight: 700 }}>
                  {activeToast.scope && (
                    <span style={{ background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px" }}>
                      Scope: {activeToast.scope}
                    </span>
                  )}
                  {activeToast.amount ? (
                    <span style={{ color: "#047857", fontWeight: 800, background: "#ecfdf5", padding: "1px 8px", borderRadius: "4px", border: "1px solid #a7f3d0" }}>
                      Approved Total: ₹{activeToast.amount.toLocaleString("en-IN")}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleOpenJob(activeToast.jobId, activeToast.id, activeToast)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: activeToast.stage === "PRICE_APPROVED_BY_MD" ? "#047857" : "#0f766e",
                  color: "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(15,118,110,0.25)",
                }}
              >
                <span>{activeToast.stage === "PRICE_APPROVED_BY_MD" ? "Open Quotations & Dispatch ➔" : "Open Job Card & Details"}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING WORKFLOW NOTIFICATION BELL (BOTTOM-RIGHT) */}
      <div ref={panelContainerRef} style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPanelOpen((prev) => !prev);
          }}
          style={{
            position: "relative",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: unreadCount > 0 ? "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" : "#ffffff",
            color: unreadCount > 0 ? "#ffffff" : "#475569",
            border: unreadCount > 0 ? "2px solid #99f6e4" : "1.5px solid #cbd5e1",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          title="Workflow Operations Pipeline Alerts"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "10.5px",
                fontWeight: 800,
                borderRadius: "10px",
                padding: "1px 6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* WORKFLOW ALERTS DROPDOWN PANEL */}
        {panelOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "58px",
              right: 0,
              width: "380px",
              maxHeight: "480px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              boxShadow: "0 20px 45px -10px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 10000,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  Operations Alerts ({userAlerts.length})
                </h4>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  Suganya • Rekha • Sabitha • Priya • Senthil • MD • Aravindh
                </p>
              </div>
              {userAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAlertsRead}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#0f766e",
                    cursor: "pointer",
                  }}
                >
                  Mark All Read
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {userAlerts.length === 0 ? (
                <div style={{ padding: "30px 16px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                  No pending workflow alerts. When equipment is received, repaired, or approved, popups appear here.
                </div>
              ) : (
                userAlerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleOpenJob(a.jobId, a.id, a)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: a.stage === "PRICE_APPROVED_BY_MD"
                        ? "1.5px solid #10b981"
                        : a.read
                        ? "1px solid #f1f5f9"
                        : "1.5px solid #a7f3d0",
                      background: a.stage === "PRICE_APPROVED_BY_MD"
                        ? "#ecfdf5"
                        : a.read
                        ? "#ffffff"
                        : "#f0fdfa",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: a.stage === "PRICE_APPROVED_BY_MD" ? "#047857" : "#0f766e",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {a.stage === "PRICE_APPROVED_BY_MD" && <MailCheck size={13} style={{ color: "#059669" }} />}
                        <span>{a.title}</span>
                      </span>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#1e293b", marginTop: "3px", fontWeight: a.read ? 500 : 700 }}>
                      {a.message}
                    </div>
                    <div style={{ fontSize: "11px", color: "#334155", marginTop: "5px", background: "#f8fafc", padding: "5px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        📦 {a.equipmentName} {a.equipmentModel ? `(${a.equipmentModel})` : ""} {a.serialNo ? `• SN: ${a.serialNo}` : ""}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                        👤 {a.customerName} {a.customerPhone ? `• ${a.customerPhone}` : ""} {a.customerCity ? `(${a.customerCity})` : ""} • Job #{a.jobNo}
                      </div>
                      {(a.scope || a.amount) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          {a.scope && (
                            <span style={{ background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>
                              {a.scope}
                            </span>
                          )}
                          {a.amount ? (
                            <span style={{ color: "#047857", fontWeight: 800, fontSize: "10.5px" }}>
                              Approved: ₹{a.amount.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
