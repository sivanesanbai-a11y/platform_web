"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Search, Wrench, FileSpreadsheet } from "lucide-react";
import { AnimatedSelect } from "@/components/ui/select";
import { dateText, getOverview, getProcessStatus, money } from "@/lib/data";
import { syncPullFromCloud } from "@/lib/sync";
import type { Overview, ProcessPayload } from "@/lib/types";

export default function ReportsClient() {
  const sp = useSearchParams();
  const [source] = useState<"servicing">("servicing");
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState("ALL");
  const [branch, setBranch] = useState("ALL");
  const [employee, setEmployee] = useState("ALL");
  const [data, setData] = useState<ProcessPayload>({
    purchasing: [],
    servicing: [],
    generated_at: new Date().toISOString(),
  });
  const [overview, setOverview] = useState<Overview | null>(null);

  const loadLocalReports = () => {
    try {
      const sRaw = typeof window !== "undefined" ? localStorage.getItem("nunes:service_jobs") : null;
      const sList = sRaw ? JSON.parse(sRaw) : [];
      const sFormatted = sList.map((x: any) => ({
        id: x.jobNo || x.id,
        job_no: x.jobNo || x.id,
        customer: x.customer?.name || "Customer",
        product:
          (x.products || [])
            .map((p: any) => (p.productName ? `${p.productName}${p.makeModel ? ` (${p.makeModel})` : ""}` : ""))
            .filter(Boolean)
            .join(", ") || "Equipment Service",
        branch: x.branchName || "Head Office",
        status: x.status || "RECEIVED",
        current_stage: x.workflow?.stage ? x.workflow.stage.replace(/_/g, " ") : (x.status || "Received"),
        progress: x.workflow?.stage === "JOB_COMPLETED" || x.status === "CLOSED" ? 100 : 45,
        estimate: Number(x.workflow?.customApprovedPrice || x.workflow?.mdApprovedPrice || x.workflow?.priyaTotalQuotationAmount || x.totals?.totalEstimate || 0),
        staff: [x.workflow?.mechanicAssigned || "Technician"],
        updated_at: x.updatedAt || new Date().toISOString(),
      }));
      setData({ purchasing: [], servicing: sFormatted as any, generated_at: new Date().toISOString() });
    } catch {}
  };

  useEffect(() => {
    let alive = true;
    loadLocalReports();

    void syncPullFromCloud().then(() => {
      if (alive) loadLocalReports();
    });

    const refreshData = () => {
      loadLocalReports();
      Promise.all([
        getProcessStatus(true).catch(() => null),
        getOverview(true).catch(() => null),
      ]).then(([p, o]) => {
        if (!alive) return;
        if (p && p.servicing?.length) {
          setData(p);
        }
        if (o) setOverview(o);
      });
    };

    refreshData();
    window.addEventListener("nunes:records-synced", refreshData);
    const interval = setInterval(refreshData, 15000);

    return () => {
      alive = false;
      window.removeEventListener("nunes:records-synced", refreshData);
      clearInterval(interval);
    };
  }, []);

  const all: any[] = data?.servicing || [];
  const sListLive = all;
  const sTotal = sListLive.length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonthStr = todayStr.slice(0, 7);

  const todayAllForms = sListLive.filter((x: any) => (x.updated_at || "").slice(0, 10) === todayStr).length;
  const sMonth = sListLive.filter((x: any) => (x.updated_at || "").slice(0, 7) === thisMonthStr).length;

  // Build daily rows strictly from actual real service records
  const dailyMap = new Map<string, { key: string; label: string; servicing: number }>();
  for (const x of sListLive) {
    const k = (x.updated_at || todayStr).slice(0, 10);
    const row = dailyMap.get(k) || {
      key: k,
      label: new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      servicing: 0,
    };
    row.servicing += 1;
    dailyMap.set(k, row);
  }
  const dailyRows = Array.from(dailyMap.values()).sort((a, b) => b.key.localeCompare(a.key)).slice(0, 14);

  const statuses = Array.from(new Set(all.map((x) => x.status).filter(Boolean))).sort();
  const branches = Array.from(new Set(all.map((x) => x.branch).filter(Boolean))).sort();
  const people = Array.from(new Set(all.flatMap((x) => x.staff || []).filter(Boolean))).sort();

  const statusOptions = useMemo(
    () => [{ value: "ALL", label: "All statuses" }, ...statuses.map((x) => ({ value: x, label: x }))],
    [statuses]
  );
  const branchOptions = useMemo(
    () => [{ value: "ALL", label: "All branches" }, ...branches.map((x) => ({ value: x, label: x }))],
    [branches]
  );
  const employeeOptions = useMemo(
    () => [{ value: "ALL", label: "All engineers" }, ...people.map((x) => ({ value: x, label: x }))],
    [people]
  );

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter(
      (x) =>
        (!s || JSON.stringify(x).toLowerCase().includes(s)) &&
        (status === "ALL" || x.status === status) &&
        (branch === "ALL" || x.branch === branch) &&
        (employee === "ALL" || (x.staff || []).includes(employee))
    );
  }, [all, q, status, branch, employee]);

  const csv = () => {
    const head = ["Job No", "Customer", "Product", "Branch", "Status", "Current Stage", "Progress", "Estimate", "People", "Updated"];
    const body = rows.map((x: any) => [
      x.job_no,
      x.customer,
      x.product,
      x.branch,
      x.status,
      x.current_stage,
      x.progress,
      x.estimate,
      (x.staff || []).join(" | "),
      x.updated_at,
    ]);
    const esc = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const content = [head.map(esc).join(","), ...body.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nunes-servicing-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Unified Action & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Workstation Header Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold shrink-0">
            <Wrench size={14} />
            <span>Servicing Operations Reports</span>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search service job, customer, product…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Dropdown Filters */}
          <AnimatedSelect
            value={status}
            onChange={setStatus}
            options={statusOptions}
            placeholder="Status"
            className="w-36 h-9"
          />
          <AnimatedSelect
            value={branch}
            onChange={setBranch}
            options={branchOptions}
            placeholder="Branch"
            className="w-36 h-9"
          />
          <AnimatedSelect
            value={employee}
            onChange={setEmployee}
            options={employeeOptions}
            placeholder="Staff"
            className="w-36 h-9"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={csv}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Form-wise Filling Summary */}
      <section className="section reports-form-counts">
        <div className="section-head">
          <div>
            <h2>Service Job Activity Summary</h2>
            <p>Real saved service and calibration records over time.</p>
          </div>
        </div>
        <div className="section-body">
          <div className="report-form-kpis">
            <div>
              <span>Total Service Jobs</span>
              <b>{sTotal}</b>
              <small>{todayAllForms} today</small>
            </div>
            <div>
              <span>Completed Jobs</span>
              <b>{sListLive.filter((x: any) => x.status === "CLOSED" || x.status === "COMPLETED" || x.progress === 100).length}</b>
              <small>Verified closed batches</small>
            </div>
            <div>
              <span>Active in Workshop</span>
              <b>{sListLive.filter((x: any) => x.status !== "CLOSED" && x.status !== "COMPLETED" && x.progress !== 100).length}</b>
              <small>{sMonth} this month</small>
            </div>
          </div>
          <div className="daywise-form-table reports-daywise">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service Jobs Logged</th>
                  <th>Activity Type</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.length > 0 ? (
                  dailyRows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <b>{r.label}</b>
                        <small>{r.key}</small>
                      </td>
                      <td>
                        <span className="form-count servicing">{r.servicing}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                          Workshop Diagnostics &amp; Intake
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No service records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detail Records Section */}
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Service Operations Reports</h2>
            <p>{rows.length} service records match the current filters.</p>
          </div>
        </div>
        <div className="section-body">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Job No</th>
                  <th>Customer</th>
                  <th>Product / Equipment</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Current stage</th>
                  <th>Progress</th>
                  <th>Estimate</th>
                  <th>Engineer</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <b>{r.job_no}</b>
                    </td>
                    <td>{r.customer}</td>
                    <td>
                      <b style={{ color: "#0f2e5a" }}>{r.product || "—"}</b>
                    </td>
                    <td>{r.branch}</td>
                    <td>
                      <span className="status-chip">{r.status}</span>
                    </td>
                    <td>{r.current_stage}</td>
                    <td>{r.progress}%</td>
                    <td className="money">{money(r.estimate)}</td>
                    <td>{(r.staff || []).slice(0, 3).join(", ") || "—"}</td>
                    <td>{dateText(r.updated_at)}</td>
                    <td>
                      <Link href={`/forms/servicing?job=${encodeURIComponent(r.job_no || r.id)}`} className="text-link">
                        Open Job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
