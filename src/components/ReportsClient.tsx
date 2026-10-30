"use client";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {Download,Search,Trash2} from "lucide-react";
import {AnimatedSelect} from "@/components/ui/select";
import {clearAllOlderForms,dateText,getOverview,getProcessStatus,money} from "@/lib/data";
import { syncPullFromCloud } from "@/lib/sync";
import type {Overview,ProcessPayload} from "@/lib/types";
const baselinePurchasing: any[] = [];
const baselineServicing: any[] = [];

export default function ReportsClient(){
  const sp=useSearchParams();const initial=sp.get("source");
  const [source,setSource]=useState(initial==="purchasing"||initial==="servicing"?initial:"purchasing");
  const [q,setQ]=useState(sp.get("q")||"");
  const [status,setStatus]=useState("ALL");
  const [branch,setBranch]=useState("ALL");
  const [employee,setEmployee]=useState("ALL");
  const [market,setMarket]=useState("ALL");
  const [data,setData]=useState<ProcessPayload>({
    purchasing: [],
    servicing: [],
    generated_at: new Date().toISOString()
  });
  const [overview,setOverview]=useState<Overview|null>(null);
  const [purgeNotice,setPurgeNotice]=useState<string|null>(null);

  const loadLocalReports = () => {
    try {
      const pRaw = typeof window !== 'undefined' ? localStorage.getItem('nunes:purchasing_orders') : null;
      const sRaw = typeof window !== 'undefined' ? localStorage.getItem('nunes:service_jobs') : null;
      const pList = pRaw ? JSON.parse(pRaw) : [];
      const sList = sRaw ? JSON.parse(sRaw) : [];
      const pFormatted = pList.map((x:any)=>({
        id: x.order_id || x.id,
        order_id: x.order_id || x.id,
        customer: x.customer_name || 'Client',
        product: (x.marketing_items || []).map((m: any) => m.item_name ? `${m.item_name}${m.model ? ` (${m.model})` : ''}` : '').filter(Boolean).join(', ') || 'Ordered Items',
        branch: x.branch || 'MAIN',
        market_type: x.market_type || 'IND',
        status: x.current_status || 'In Progress',
        current_stage: x.current_status || 'Marketing',
        progress: 35,
        value: Number(x.total_order_value || 0),
        staff: x.marketing_person ? [x.marketing_person] : ['Staff'],
        updated_at: x.updated_at || new Date().toISOString()
      }));
      const sFormatted = sList.map((x:any)=>({
        id: x.jobNo || x.id,
        job_no: x.jobNo || x.id,
        customer: x.customer?.name || 'Customer',
        product: (x.products || []).map((p: any) => p.productName ? `${p.productName}${p.makeModel ? ` (${p.makeModel})` : ''}` : '').filter(Boolean).join(', ') || 'Equipment Service',
        branch: x.branchName || 'Head Office',
        status: x.status || 'RECEIVED',
        current_stage: x.status || 'Received',
        progress: 25,
        estimate: Number(x.totals?.totalEstimate || 0),
        staff: ['Technician'],
        updated_at: x.updatedAt || new Date().toISOString()
      }));
      setData({ purchasing: pFormatted as any, servicing: sFormatted as any, generated_at: new Date().toISOString() });
    } catch {}
  };

  const handlePurgeAllOlderForms = () => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to delete all older forms and report records? This will purge all saved jobs and return to clean zero state.")) {
      clearAllOlderForms();
      loadLocalReports();
      setOverview(null);
      setPurgeNotice("✓ All older forms, job history, and report records have been purged successfully.");
      setTimeout(() => setPurgeNotice(null), 5000);
    }
  };

  useEffect(()=>{
    let alive=true;
    loadLocalReports();

    void syncPullFromCloud().then(() => {
      if (alive) loadLocalReports();
    });

    const refreshData = () => {
      loadLocalReports();
      Promise.all([
        getProcessStatus(true).catch(()=>null),
        getOverview(true).catch(()=>null)
      ]).then(([p,o])=>{
        if(!alive)return;
        if(p && (p.purchasing?.length || p.servicing?.length)) {
          setData(p);
        }
        if(o) setOverview(o);
      });
    };

    refreshData();
    window.addEventListener("nunes:records-synced", refreshData);
    const interval = setInterval(refreshData, 15000);

    return ()=>{
      alive=false;
      window.removeEventListener("nunes:records-synced", refreshData);
      clearInterval(interval);
    };
  },[]);

  const liveAll:any[]=source==="purchasing"?(data?.purchasing||[]):(data?.servicing||[]);
  const all:any[]=liveAll;

  const pListLive = data?.purchasing || [];
  const sListLive = data?.servicing || [];

  const pTotal = pListLive.length;
  const sTotal = sListLive.length;
  const totalAllForms = pTotal + sTotal;

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonthStr = todayStr.slice(0, 7);

  const todayAllForms = [...pListLive, ...sListLive].filter((x: any) => (x.updated_at || "").slice(0, 10) === todayStr).length;
  const pMonth = pListLive.filter((x: any) => (x.updated_at || "").slice(0, 7) === thisMonthStr).length;
  const sMonth = sListLive.filter((x: any) => (x.updated_at || "").slice(0, 7) === thisMonthStr).length;

  // Build daily rows strictly from actual real records
  const dailyMap = new Map<string, { key: string; label: string; purchasing: number; servicing: number; total: number }>();
  for (const x of pListLive) {
    const k = (x.updated_at || todayStr).slice(0, 10);
    const row = dailyMap.get(k) || { key: k, label: new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), purchasing: 0, servicing: 0, total: 0 };
    row.purchasing += 1;
    row.total += 1;
    dailyMap.set(k, row);
  }
  for (const x of sListLive) {
    const k = (x.updated_at || todayStr).slice(0, 10);
    const row = dailyMap.get(k) || { key: k, label: new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), purchasing: 0, servicing: 0, total: 0 };
    row.servicing += 1;
    row.total += 1;
    dailyMap.set(k, row);
  }
  const dailyRows = Array.from(dailyMap.values()).sort((a, b) => b.key.localeCompare(a.key)).slice(0, 14);

  const statuses=Array.from(new Set(all.map(x=>x.status).filter(Boolean))).sort();
  const branches=Array.from(new Set(all.map(x=>x.branch).filter(Boolean))).sort();
  const people=Array.from(new Set(all.flatMap(x=>x.staff||[]).filter(Boolean))).sort();

  const statusOptions = useMemo(() => [
    { value: "ALL", label: "All statuses" },
    ...statuses.map(x => ({ value: x, label: x }))
  ], [statuses]);

  const branchOptions = useMemo(() => [
    { value: "ALL", label: "All branches" },
    ...branches.map(x => ({ value: x, label: x }))
  ], [branches]);

  const employeeOptions = useMemo(() => [
    { value: "ALL", label: "All employees" },
    ...people.map(x => ({ value: x, label: x }))
  ], [people]);

  const marketOptions = useMemo(() => [
    { value: "ALL", label: "IND + EXPORT" },
    { value: "IND", label: "IND" },
    { value: "EXPORT", label: "EXPORT" },
  ], []);

  const rows=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return all.filter(x=>(!s||JSON.stringify(x).toLowerCase().includes(s))&&(status==="ALL"||x.status===status)&&(branch==="ALL"||x.branch===branch)&&(employee==="ALL"||(x.staff||[]).includes(employee))&&(source!=="purchasing"||market==="ALL"||x.market_type===market));
  },[all,q,status,branch,employee,market,source]);

  const csv=()=>{
    const head=source==="purchasing"?["Order","Customer","Branch","Market","Status","Current Stage","Progress","Value","People","Updated"]:["Job","Customer","Product","Branch","Status","Current Stage","Progress","Estimate","People","Updated"];
    const body=rows.map((x:any)=>source==="purchasing"?[x.order_id,x.customer,x.branch,x.market_type,x.status,x.current_stage,x.progress,x.value,(x.staff||[]).join(" | "),x.updated_at]:[x.job_no,x.customer,x.product,x.branch,x.status,x.current_stage,x.progress,x.estimate,(x.staff||[]).join(" | "),x.updated_at]);
    const esc=(v:any)=>`"${String(v??"").replaceAll('"','""')}"`;
    const blob=new Blob([[head,...body].map(r=>r.map(esc).join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`nunes-${source}-reports.csv`;a.click();URL.revokeObjectURL(a.href);
  };


  return (
    <main className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Unified Action & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Module Switcher Tabs */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold shrink-0">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                source === "purchasing"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setSource("purchasing")}
            >
              Purchasing
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                source === "servicing"
                  ? "bg-white text-teal-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setSource("servicing")}
            >
              Servicing
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer, product, worker…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Dropdown Filters - Neatly Sized and Aligned inline */}
          <AnimatedSelect
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
            placeholder="All statuses"
            triggerClassName="h-9 w-auto min-w-[130px] max-w-[155px] text-xs font-medium rounded-xl border-slate-200 bg-white shadow-2xs"
          />
          <AnimatedSelect
            value={branch}
            onValueChange={setBranch}
            options={branchOptions}
            placeholder="All branches"
            triggerClassName="h-9 w-auto min-w-[130px] max-w-[155px] text-xs font-medium rounded-xl border-slate-200 bg-white shadow-2xs"
          />
          <AnimatedSelect
            value={employee}
            onValueChange={setEmployee}
            options={employeeOptions}
            placeholder="All employees"
            triggerClassName="h-9 w-auto min-w-[135px] max-w-[160px] text-xs font-medium rounded-xl border-slate-200 bg-white shadow-2xs"
          />
          {source === "purchasing" && (
            <AnimatedSelect
              value={market}
              onValueChange={setMarket}
              options={marketOptions}
              placeholder="IND + EXPORT"
              triggerClassName="h-9 w-auto min-w-[125px] max-w-[145px] text-xs font-medium rounded-xl border-slate-200 bg-white shadow-2xs"
            />
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            onClick={handlePurgeAllOlderForms}
            title="Delete all stored older forms and report records"
          >
            <Trash2 size={14} />
            <span>Delete All Older Forms</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            onClick={csv}
          >
            <Download size={14} />
            <span>Export current CSV</span>
          </button>
        </div>
      </div>

      {purgeNotice && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-medium">
          <span>{purgeNotice}</span>
          <button
            type="button"
            onClick={() => setPurgeNotice(null)}
            className="text-red-700 hover:text-red-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    <section className="section reports-form-counts">
      <div className="section-head">
        <div>
          <h2>Form-wise filling summary</h2>
          <p>Saved form counts, separated by Purchasing and Servicing.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="report-form-kpis">
          <div><span>All forms</span><b>{totalAllForms}</b><small>{todayAllForms} today</small></div>
          <div><span>Purchasing</span><b>{pTotal}</b><small>{pMonth} this month</small></div>
          <div><span>Servicing</span><b>{sTotal}</b><small>{sMonth} this month</small></div>
        </div>
        <div className="daywise-form-table reports-daywise">
          <table>
            <thead><tr><th>Date</th><th>Purchasing</th><th>Servicing</th><th>Total</th></tr></thead>
            <tbody>
              {dailyRows.length > 0 ? (
                dailyRows.map(r=>(
                  <tr key={r.key}>
                    <td><b>{r.label}</b><small>{r.key}</small></td>
                    <td><span className="form-count purchasing">{r.purchasing}</span></td>
                    <td><span className="form-count servicing">{r.servicing}</span></td>
                    <td><strong>{r.total}</strong></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No form filling records found. All older forms have been deleted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="section-head">
        <div>
          <h2>{source==="purchasing"?"Purchasing reports":"Servicing reports"}</h2>
          <p>{rows.length} records match the current filters.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{source==="purchasing"?"Order":"Job"}</th>
                <th>Customer</th>
                <th>Product / Items</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Current stage</th>
                <th>Progress</th>
                <th>{source==="purchasing"?"Value":"Estimate"}</th>
                <th>People</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r:any)=><tr key={r.id}>
                <td><b>{source==="purchasing"?r.order_id:r.job_no}</b>{source==="purchasing"&&<span className="sub">{r.market_type}</span>}</td>
                <td>{r.customer}</td>
                <td><b style={{ color: '#0f2e5a' }}>{r.product || "—"}</b></td>
                <td>{r.branch}</td>
                <td><span className="status-chip">{r.status}</span></td>
                <td>{r.current_stage}</td>
                <td>{r.progress}%</td>
                <td className="money">{money(source==="purchasing"?r.value:r.estimate)}</td>
                <td>{(r.staff||[]).slice(0,3).join(", ")||"—"}</td>
                <td>{dateText(r.updated_at)}</td>
                <td>
                  <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                    <Link className="mini-btn" href={`/process/${source}/${encodeURIComponent(String(r.id))}`}>View</Link>
                    <Link className="mini-btn primary" href={`/forms/${source}?id=${encodeURIComponent(String(r.id))}`}>Form</Link>
                  </div>
                </td>
              </tr>)}
            </tbody>
          </table>
          {!rows.length&&<div className="empty">No matching reports. All older forms have been deleted.</div>}
        </div>
      </div>
    </section>
  </main>
  );
}
