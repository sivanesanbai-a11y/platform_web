"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  Save,
  Server,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Users,
  Wrench,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { performLogout } from "@/lib/auth";
import { clearAllOlderForms } from "@/lib/data";
import { syncFormToCloud } from "@/lib/sync";

const WORKER_ACCOUNTS = [
  { id: "suganya", email: "suganya@nunesinstruments.com", name: "Suganya (Branch Office Intake)", role: "Branch Office & Online Intake", defaultPass: "suganya@2026" },
  { id: "radha", email: "radha@nunesinstruments.com", name: "Radha (Branch Office Intake)", role: "Branch Office & Customer Intake", defaultPass: "radha@2026" },
  { id: "rekha", email: "rekha@nunesinstruments.com", name: "Rekha (Online & Phone Intake)", role: "Front Office & Order Intake", defaultPass: "rekha@2026" },
  { id: "sabitha", email: "sabitha@nunesinstruments.com", name: "Sabitha (Online & Phone Intake)", role: "Front Office & Order Intake", defaultPass: "sabitha@2026" },
  { id: "priya", email: "azhalakupriya@nunesinstruments.com", name: "Azhalaku Priya (Pricing & Quotations)", role: "Quotation & Handover Lead", defaultPass: "priya@2026" },
  { id: "senthil", email: "senthil@nunesinstruments.com", name: "Senthil Kumar (Service Mechanic)", role: "Mechanical Repair Specialist", defaultPass: "senthil@2026" },
  { id: "aravindh", email: "aravindh@nunesinstruments.com", name: "Aravindh (Lead Coordinator)", role: "Lead Service & Handover", defaultPass: "aravindh@2026" },
  { id: "md", email: "md@nunesinstruments.com", name: "MD / Director (Management)", role: "Executive Management & Approvals", defaultPass: "md@nunes2026" },
  { id: "admin", email: "admin@nunes.com", name: "Administrator", role: "System Administrator", defaultPass: "admin123" },
];

export default function SettingsPage() {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("Just now");
  const [dataStats, setDataStats] = useState({
    serviceJobs: 0,
    purchasingOrders: 0,
    quotations: 0,
    customers: 0,
    suppliers: 0,
  });
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  // Password Management State
  const [currentAuthEmail, setCurrentAuthEmail] = useState("suganya@nunesinstruments.com");
  const [targetAccountEmail, setTargetAccountEmail] = useState("suganya@nunesinstruments.com");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showCredentialsTable, setShowCredentialsTable] = useState(false);

  // Cloud Sync State
  const [cloudWebhookUrl, setCloudWebhookUrl] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [testSyncLoading, setTestSyncLoading] = useState(false);
  const [testSyncResult, setTestSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Google Account Archival State
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleAppPassword, setGoogleAppPassword] = useState("tpqb fhyx dgfx wcpx");
  const [googleAutoBackup, setGoogleAutoBackup] = useState(true);
  const [googleTestLoading, setGoogleTestLoading] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [googleBackupAllLoading, setGoogleBackupAllLoading] = useState(false);
  const [googleBackupAllResult, setGoogleBackupAllResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const refreshStats = () => {
    try {
      const s = localStorage.getItem("nunes:service_jobs");
      const p = localStorage.getItem("nunes:purchasing_orders");
      const q = localStorage.getItem("nunes:quotations");
      const c = localStorage.getItem("nunes:customers");
      const sup = localStorage.getItem("nunes:suppliers");

      setDataStats({
        serviceJobs: s ? JSON.parse(s).length : 0,
        purchasingOrders: p ? JSON.parse(p).length : 0,
        quotations: q ? JSON.parse(q).length : 0,
        customers: c ? JSON.parse(c).length : 0,
        suppliers: sup ? JSON.parse(sup).length : 0,
      });

      setCloudWebhookUrl(localStorage.getItem("nunes:cloud_webhook_url") || "");
      setAutoSync(localStorage.getItem("nunes:auto_cloud_sync") !== "false");

      setGoogleEmail(localStorage.getItem("nunes:google_backup_email") || "");
      setGoogleAppPassword(localStorage.getItem("nunes:google_app_password") || "tpqb fhyx dgfx wcpx");
      setGoogleAutoBackup(localStorage.getItem("nunes:google_backup_auto") !== "false");
    } catch {}
  };

  useEffect(() => {
    refreshStats();
    try {
      const sess = localStorage.getItem("nunes_auth_session");
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed?.email) {
          setCurrentAuthEmail(parsed.email);
          setTargetAccountEmail(parsed.email);
        }
      }
    } catch {}
  }, []);

  const isAdminOrMd = useMemo(() => {
    const u = (currentAuthEmail || "").toLowerCase();
    return u.includes("admin") || u.includes("md") || u.startsWith("director");
  }, [currentAuthEmail]);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordError("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError("New password and Confirm password do not match.");
      return;
    }

    const cleanPass = newPassword.trim();
    const targetEmail = targetAccountEmail.trim().toLowerCase();
    const matched = WORKER_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === targetEmail || a.id.toLowerCase() === targetEmail
    );
    const targetId = matched ? matched.id : targetEmail.split("@")[0];

    try {
      // 1. Update nunes_custom_passwords
      let customPass: Record<string, string> = {};
      try {
        customPass = JSON.parse(localStorage.getItem("nunes_custom_passwords") || "{}");
      } catch {}
      customPass[targetId] = cleanPass;
      customPass[targetEmail] = cleanPass;
      localStorage.setItem("nunes_custom_passwords", JSON.stringify(customPass));

      // 2. Update 3d_auth_users
      let users: any[] = [];
      try {
        users = JSON.parse(localStorage.getItem("3d_auth_users") || "[]");
      } catch {}
      users = users.filter(
        (u: any) => u.email.toLowerCase() !== targetEmail && u.email.toLowerCase() !== targetId
      );
      users.push({ email: targetEmail, password: cleanPass });
      users.push({ email: targetId, password: cleanPass });
      localStorage.setItem("3d_auth_users", JSON.stringify(users));

      // 3. Sync to Cloud if active
      void syncFormToCloud("auth_user", targetEmail, targetId, {
        email: targetEmail,
        password: cleanPass,
      });

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(
        `✓ Password for ${matched ? matched.name : targetEmail} updated successfully! New password is now active.`
      );
      setTimeout(() => setPasswordSuccess(""), 6000);
    } catch (err: any) {
      setPasswordError("Failed to update password: " + (err.message || "Unknown error"));
    }
  };

  const handleSaveAllSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem("nunes:cloud_webhook_url", cloudWebhookUrl.trim());
      localStorage.setItem("nunes:auto_cloud_sync", String(autoSync));
      localStorage.setItem("nunes:google_backup_email", googleEmail.trim());
      localStorage.setItem("nunes:google_app_password", googleAppPassword.trim());
      localStorage.setItem("nunes:google_backup_auto", String(googleAutoBackup));

      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch {}
  };

  const handleTestGoogleConnection = async () => {
    if (!googleEmail.trim()) {
      setGoogleTestResult({
        ok: false,
        msg: "Please enter your Google / Gmail address first.",
      });
      return;
    }

    // Auto-persist credentials
    try {
      localStorage.setItem("nunes:google_backup_email", googleEmail.trim());
      localStorage.setItem("nunes:google_app_password", googleAppPassword.trim());
    } catch {}

    setGoogleTestLoading(true);
    setGoogleTestResult(null);

    try {
      const res = await fetch("/api/backup/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diagnostic_test",
          id: `TEST-${Date.now()}`,
          customer: "NUNES Google Connection Test",
          email: googleEmail.trim(),
          app_password: googleAppPassword.trim(),
          data: {
            status: "SUCCESS",
            tested_at: new Date().toISOString(),
            facility: "Coimbatore",
          },
          title: `[TEST PING] NUNES Google Cloud Backup Connection Verified`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleTestResult({
          ok: true,
          msg: `Verified! Test backup email sent to ${googleEmail.trim()}`,
        });
      } else {
        setGoogleTestResult({
          ok: false,
          msg: data.error || "Failed to authenticate with Google SMTP.",
        });
      }
    } catch (err: any) {
      setGoogleTestResult({
        ok: false,
        msg: err.message || "Network error connecting to Google Backup API.",
      });
    } finally {
      setGoogleTestLoading(false);
    }
  };

  const handleBackupAllToGoogle = async () => {
    if (!googleEmail.trim()) {
      setGoogleBackupAllResult({
        ok: false,
        msg: "Please enter your Google / Gmail address first.",
      });
      return;
    }

    // Auto-persist credentials
    try {
      localStorage.setItem("nunes:google_backup_email", googleEmail.trim());
      localStorage.setItem("nunes:google_app_password", googleAppPassword.trim());
    } catch {}

    setGoogleBackupAllLoading(true);
    setGoogleBackupAllResult(null);

    try {
      const sJobs = JSON.parse(localStorage.getItem("nunes:service_jobs") || "[]");
      const pOrders = JSON.parse(localStorage.getItem("nunes:purchasing_orders") || "[]");
      const quotes = JSON.parse(localStorage.getItem("nunes:quotations") || "[]");
      const custs = JSON.parse(localStorage.getItem("nunes:customers") || "[]");
      const sups = JSON.parse(localStorage.getItem("nunes:suppliers") || "[]");

      const res = await fetch("/api/backup/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "master_full_backup",
          id: `BACKUP-${new Date().toISOString().slice(0, 10)}`,
          customer: "NUNES Operations Archive",
          email: googleEmail.trim(),
          app_password: googleAppPassword.trim(),
          data: {
            service_jobs: sJobs,
            purchasing_orders: pOrders,
            quotations: quotes,
            customers: custs,
            suppliers: sups,
            stats: {
              total_service: sJobs.length,
              total_orders: pOrders.length,
              total_quotations: quotes.length,
              total_customers: custs.length,
              total_suppliers: sups.length,
            },
            exported_at: new Date().toISOString(),
          },
          title: `[MASTER BACKUP] NUNES Operations (${sJobs.length} Jobs, ${pOrders.length} Orders, ${quotes.length} Quotes)`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleBackupAllResult({
          ok: true,
          msg: `Successfully archived ${sJobs.length} Jobs, ${pOrders.length} Orders, and ${quotes.length} Quotes to Google!`,
        });
      } else {
        setGoogleBackupAllResult({
          ok: false,
          msg: data.error || "Failed to dispatch master backup.",
        });
      }
    } catch (err: any) {
      setGoogleBackupAllResult({
        ok: false,
        msg: err.message || "Error during master backup upload.",
      });
    } finally {
      setGoogleBackupAllLoading(false);
    }
  };

  const handleTestCloudConnection = async () => {
    setTestSyncLoading(true);
    setTestSyncResult(null);

    try {
      localStorage.setItem("nunes:cloud_webhook_url", cloudWebhookUrl.trim());
    } catch {}

    try {
      const res = await fetch("/api/sync/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diagnostic_ping",
          id: `TEST-${Date.now()}`,
          customer: "NUNES Diagnostics Test",
          data: { status: "PING", hub: "Coimbatore" },
          webhook_url: cloudWebhookUrl.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestSyncResult({
          ok: true,
          msg: cloudWebhookUrl
            ? "Successfully connected to Cloud Webhook endpoint!"
            : "Internal sync engine ready. Enter a webhook URL to forward submissions.",
        });
      } else {
        setTestSyncResult({
          ok: false,
          msg: data.error || "Failed to connect to cloud endpoint.",
        });
      }
    } catch (err: any) {
      setTestSyncResult({
        ok: false,
        msg: err.message || "Network error testing cloud connection.",
      });
    } finally {
      setTestSyncLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setChecking(true);
    try {
      await fetch("/api/health");
    } catch {}
    setChecking(false);
    setLastChecked(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    refreshStats();
  };

  const handleExportCSV = () => {
    try {
      const sJobs = JSON.parse(localStorage.getItem("nunes:service_jobs") || "[]");
      const pOrders = JSON.parse(localStorage.getItem("nunes:purchasing_orders") || "[]");
      const quotes = JSON.parse(localStorage.getItem("nunes:quotations") || "[]");

      let csv = "Record Type,ID / Ref,Customer,Product / Scope,Amount,Status,Date\n";

      sJobs.forEach((s: any) => {
        csv += `"Servicing","${s.jobNo || s.id}","${(s.customer?.name || "Customer").replace(/"/g, '""')}","${(
          s.products?.[0]?.productName || "Equipment"
        ).replace(/"/g, '""')}","${s.totals?.totalEstimate || 0}","${s.status || "RECEIVED"}","${
          s.updatedAt || ""
        }"\n`;
      });

      pOrders.forEach((p: any) => {
        csv += `"Purchasing","${p.order_id || p.id}","${(p.customer_name || "Customer").replace(/"/g, '""')}","${(
          p.marketing_items?.[0]?.item_name || "Items"
        ).replace(/"/g, '""')}","${p.total_order_value || 0}","${p.current_status || "In Progress"}","${
          p.updated_at || ""
        }"\n`;
      });

      quotes.forEach((q: any) => {
        csv += `"Quotation","${q.quotation_no}","${(q.customer_name || "Customer").replace(/"/g, '""')}","${(
          q.item_description || "Scope"
        ).replace(/"/g, '""')}","${q.total_amount || 0}","${q.status || "SENT"}","${q.sent_at || ""}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nunes_operations_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export CSV.");
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = {
        service_jobs: JSON.parse(localStorage.getItem("nunes:service_jobs") || "[]"),
        purchasing_orders: JSON.parse(localStorage.getItem("nunes:purchasing_orders") || "[]"),
        quotations: JSON.parse(localStorage.getItem("nunes:quotations") || "[]"),
        customers: JSON.parse(localStorage.getItem("nunes:customers") || "[]"),
        suppliers: JSON.parse(localStorage.getItem("nunes:suppliers") || "[]"),
        cloud_webhook_url: localStorage.getItem("nunes:cloud_webhook_url") || "",
        exported_at: new Date().toISOString(),
        facility: "NUNES Instrumentation Coimbatore",
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nunes_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export backup data.");
    }
  };

  const handlePurge = async () => {
    if (
      window.confirm(
        "Purge ALL demo and stored records? The platform database and local cache will reset to completely empty."
      )
    ) {
      try {
        await fetch("/api/data/reset-all", { method: "POST" });
      } catch {}
      clearAllOlderForms();
      localStorage.setItem("nunes:service_jobs", "[]");
      localStorage.setItem("nunes:purchasing_orders", "[]");
      localStorage.setItem("nunes:quotations", "[]");
      localStorage.setItem("nunes:customers", "[]");
      localStorage.setItem("nunes_customers", "[]");
      localStorage.setItem("nunes:suppliers", "[]");
      localStorage.setItem("nunes_suppliers", "[]");
      localStorage.removeItem("nunes:service_current_draft");
      localStorage.removeItem("nunes:purchasing_current_draft");
      localStorage.removeItem("nunes:dashboard_snapshot");
      localStorage.removeItem("nunes_recent_activity");
      try {
        window.dispatchEvent(new CustomEvent("nunes:records-synced"));
      } catch {}
      refreshStats();
      setPurgeSuccess(true);
      setTimeout(() => {
        setPurgeSuccess(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Top Action Bar without bulky banner */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            System Live · Coimbatore Hub
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">Last check: {lastChecked}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunDiagnostics}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={checking ? "animate-spin text-blue-600" : "text-slate-400"} />
            <span>{checking ? "Checking..." : "Diagnostic Check"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveNotice && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold">All settings and cloud credentials saved successfully!</span>
        </div>
      )}

      {purgeSuccess && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Local cache and cached drafts purged successfully.</span>
        </div>
      )}

      {/* PRIMARY SECTION 0: Account Security & Worker Password Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <KeyRound size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Account Security &amp; Password Management</h2>
              <span className="text-[11px] text-indigo-700 font-semibold">Change your password or manage worker login credentials</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCredentialsTable(!showCredentialsTable)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Users size={13} className="text-slate-400" />
              <span>{showCredentialsTable ? "Hide Staff Accounts" : "View Staff Credentials"}</span>
            </button>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mt-3 p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mt-3 p-3 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Account to Update
              </label>
              <select
                value={targetAccountEmail}
                onChange={(e) => setTargetAccountEmail(e.target.value)}
                disabled={!isAdminOrMd}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 bg-slate-50/40 text-xs font-medium disabled:opacity-75"
              >
                {WORKER_ACCOUNTS.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} ({acc.id})
                  </option>
                ))}
              </select>
              {!isAdminOrMd && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Logged in as worker: you can change your own account password.
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 bg-slate-50/40 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 bg-slate-50/40 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <span className="text-[11.5px] text-slate-500">
              Active Session: <b>{currentAuthEmail}</b> {isAdminOrMd ? "• (Administrator / MD Access)" : "• (Worker Account)"}
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Lock size={13} />
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {/* Staff Credentials Reference Table */}
        {showCredentialsTable && (
          <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>All Worker Login Usernames &amp; Passwords</span>
              <span className="text-[11px] text-slate-400 font-normal">Use on Login Screen or 1-Click Select</span>
            </div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Staff Member</th>
                  <th className="p-2.5">Username / ID</th>
                  <th className="p-2.5">Email Address</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Active Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WORKER_ACCOUNTS.map((acc) => {
                  let cp: Record<string, string> = {};
                  try {
                    cp = JSON.parse(localStorage.getItem("nunes_custom_passwords") || "{}");
                  } catch {}
                  const activePass = cp[acc.id] || cp[acc.email] || acc.defaultPass;
                  const isModified = activePass !== acc.defaultPass;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-900">{acc.name.split(" (")[0]}</td>
                      <td className="p-2.5 font-mono text-indigo-700 font-semibold">{acc.id}</td>
                      <td className="p-2.5 text-slate-600">{acc.email}</td>
                      <td className="p-2.5 text-slate-500">{acc.role}</td>
                      <td className="p-2.5 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold">
                          {activePass}
                        </span>
                        {isModified && (
                          <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Updated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRIMARY SECTION 1: Google Account & Drive Cloud Archival */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Shield size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Google Account Archival</h2>
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Zero-loss automatic cloud backup</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestGoogleConnection}
              disabled={googleTestLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={googleTestLoading ? "animate-spin text-blue-600" : "text-slate-400"} />
              <span>{googleTestLoading ? "Testing..." : "Test Connection"}</span>
            </button>
            <button
              type="button"
              onClick={handleBackupAllToGoogle}
              disabled={googleBackupAllLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Cloud size={13} />
              <span>{googleBackupAllLoading ? "Uploading..." : "Backup All Data"}</span>
            </button>
          </div>
        </div>

        {googleTestResult && (
          <div
            className="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          >
            {googleTestResult.ok ? (
              <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{googleTestResult.msg}</span>
          </div>
        )}

        {googleBackupAllResult && (
          <div
            className="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          >
            {googleBackupAllResult.ok ? (
              <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{googleBackupAllResult.msg}</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Google / Gmail Address
            </label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              onBlur={() => handleSaveAllSettings()}
              placeholder="e.g. operations@gmail.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-emerald-500 bg-slate-50/40 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Google App Password
            </label>
            <input
              type="text"
              value={googleAppPassword}
              onChange={(e) => setGoogleAppPassword(e.target.value)}
              onBlur={() => handleSaveAllSettings()}
              placeholder="tpqb fhyx dgfx wcpx"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-emerald-500 font-mono text-xs bg-slate-50/40"
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Auto-archive every form on save to Google
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={googleAutoBackup}
              onChange={(e) => {
                setGoogleAutoBackup(e.target.checked);
                try {
                  localStorage.setItem("nunes:google_backup_auto", String(e.target.checked));
                } catch {}
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* PRIMARY SECTION 2: Cloud Database & Webhook Integration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Cloud size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cloud Webhook &amp; Sheets Sync</h2>
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Real-time webhook replication</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestCloudConnection}
              disabled={testSyncLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={testSyncLoading ? "animate-spin text-blue-600" : "text-slate-400"} />
              <span>{testSyncLoading ? "Testing..." : "Test Webhook"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Download Excel/CSV</span>
            </button>
          </div>
        </div>

        {testSyncResult && (
          <div
            className="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          >
            {testSyncResult.ok ? (
              <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{testSyncResult.msg}</span>
          </div>
        )}

        <div className="mt-4 text-xs">
          <label className="block text-slate-700 font-semibold mb-1">
            Cloud Webhook / Google Apps Script Endpoint URL
          </label>
          <input
            type="url"
            value={cloudWebhookUrl}
            onChange={(e) => setCloudWebhookUrl(e.target.value)}
            onBlur={() => handleSaveAllSettings()}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500 font-mono text-xs bg-slate-50/40"
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Auto-sync every submission to webhook
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => {
                setAutoSync(e.target.checked);
                try {
                  localStorage.setItem("nunes:auto_cloud_sync", String(e.target.checked));
                } catch {}
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* SECONDARY ROW: 3 Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Data Storage & Backup Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <Database size={16} className="text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900">Database &amp; Cache</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-base font-bold text-slate-800">{dataStats.serviceJobs}</div>
                <div className="text-[10px] text-slate-400">Jobs</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-base font-bold text-slate-800">{dataStats.purchasingOrders}</div>
                <div className="text-[10px] text-slate-400">Orders</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-base font-bold text-slate-800">{dataStats.quotations}</div>
                <div className="text-[10px] text-slate-400">Quotes</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 py-1 border-t border-slate-100">
              <span>Clients: <strong>{dataStats.customers}</strong></span>
              <span>Vendors: <strong>{dataStats.suppliers}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>JSON Backup</span>
            </button>
            <button
              type="button"
              onClick={handlePurge}
              className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Reset local drafts and cache"
            >
              <Trash2 size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Card 2: Company Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <Server size={16} className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Facility &amp; Standards</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Enterprise</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">NUNES Instruments</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Location</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Coimbatore, Tamil Nadu</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Quality Standard</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">ISO 9001:2015</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Traceability</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">NABL National Masters</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Diagnostics: {lastChecked}</span>
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Operational
            </span>
          </div>
        </div>

        {/* Card 3: Hotkeys & Shortcuts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <Activity size={16} className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Search Palette</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold">
                  Ctrl K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Dashboard</span>
                <span className="font-mono text-[10px] font-bold text-slate-600">G then D</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Forms Hub</span>
                <span className="font-mono text-[10px] font-bold text-slate-600">G then F</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Quotations</span>
                <span className="font-mono text-[10px] font-bold text-slate-600">G then Q</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Customers</span>
                <span className="font-mono text-[10px] font-bold text-slate-600">G then C</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-400 text-center">
            Press keys in sequence to trigger navigation
          </div>
        </div>
      </div>
    </div>
  );
}
