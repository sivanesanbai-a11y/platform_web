const fs = require('fs');

const fileContent = `"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FilePlus,
  FileText,
  IndianRupee,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  X,
  Wrench,
  Truck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { syncFormToCloud, syncPullFromCloud } from "@/lib/sync";
import type { ServiceJob } from "@/types/service-job";
import { DEMO_BENCHMARK_JOB } from "@/lib/service-defaults";

export interface QuotationRecord {
  id: string;
  quotation_no: string;
  customer_name: string;
  customer_phone?: string;
  customer_city?: string;
  item_description: string;
  scope_type: "Calibration" | "Servicing" | "Procurement" | "Supply";
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: "SENT" | "ACCEPTED" | "PENDING";
  sent_at: string;
  valid_until: string;
  notes?: string;
}

export default function QuotationsPage() {
  const router = useRouter();

  // Active Station Tab: Service Jobs (Primary for Priya) vs Standard Quotations
  const [activeStationTab, setActiveStationTab] = useState<"service_jobs" | "standard_quotations">("service_jobs");

  // Standard Quotations State
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [q, setQ] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "SENT" | "ACCEPTED" | "PENDING">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<QuotationRecord | null>(null);

  // Service Jobs State (Incoming from Senthil repair / workflow)
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [serviceStageFilter, setServiceStageFilter] = useState<string>("ALL");

  // Role Redirection Guard
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) {
        const email = (JSON.parse(raw)?.email || "").toLowerCase().trim();
        if (
          email &&
          !email.includes("admin") &&
          !email.includes("md") &&
          !email.startsWith("md@") &&
          !email.startsWith("admin@") &&
          !email.includes("director")
        ) {
          if (email.includes("aravind") || email.includes("senthil")) {
            router.replace("/workshop");
            return;
          }
          if (
            email.includes("suganya") ||
            email.includes("radha") ||
            email.includes("sabitha") ||
            email.includes("rekha")
          ) {
            router.replace("/forms/servicing");
            return;
          }
        }
      }
    } catch {}
  }, [router]);

  // Form State for creating new manual quotation
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCity, setNewCustCity] = useState("Coimbatore");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newScope, setNewScope] = useState<"Calibration" | "Servicing" | "Procurement" | "Supply">("Calibration");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Load Service Jobs from localStorage & Cloud
  const loadServiceJobs = () => {
    try {
      const raw = localStorage.getItem("nunes:service_jobs");
      let list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      if (list.length === 0) {
        list = [DEMO_BENCHMARK_JOB];
        localStorage.setItem("nunes:service_jobs", JSON.stringify(list));
      }
      setServiceJobs(list);
    } catch {
      setServiceJobs([DEMO_BENCHMARK_JOB]);
    }
  };

  // Load manual quotations from localStorage
  const loadQuotations = () => {
    try {
      const raw = localStorage.getItem("nunes:quotations");
      if (raw) {
        const parsed: QuotationRecord[] = JSON.parse(raw);
        const real = parsed.filter(
          (x) => x.id !== "qt-101" && x.id !== "qt-102" && x.id !== "qt-103"
        );
        setQuotations(real);
      } else {
        setQuotations([]);
      }
    } catch {
      setQuotations([]);
    }
  };

  useEffect(() => {
    loadQuotations();
    loadServiceJobs();
    void syncPullFromCloud().then(() => {
      loadQuotations();
      loadServiceJobs();
    });

    const handleSync = () => {
      loadQuotations();
      loadServiceJobs();
    };
    window.addEventListener("nunes:records-synced", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nunes:records-synced", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const saveQuotations = (list: QuotationRecord[]) => {
    setQuotations(list);
    try {
      localStorage.setItem("nunes:quotations", JSON.stringify(list));
    } catch {}
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newItemDesc.trim() || !newAmount) {
      alert("Please fill in Customer Name, Description, and Base Amount.");
      return;
    }

    const base = parseFloat(newAmount) || 0;
    const gst = Math.round(base * 0.18);
    const total = base + gst;
    const seq = quotations.length + 1;

    const record: QuotationRecord = {
      id: \`qt-\${Date.now()}\`,
      quotation_no: \`QT-2026-\${String(seq).padStart(4, "0")}\`,
      customer_name: newCustName.trim(),
      customer_phone: newCustPhone.trim() || "+91 98421 00000",
      customer_city: newCustCity.trim() || "Coimbatore",
      item_description: newItemDesc.trim(),
      scope_type: newScope,
      amount: base,
      gst_amount: gst,
      total_amount: total,
      status: "SENT",
      sent_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 86400000 * 30).toISOString(),
      notes: newNotes.trim() || "Standard NUNES Calibration & Servicing terms apply.",
    };

    const updated = [record, ...quotations];
    saveQuotations(updated);
    void syncFormToCloud("quotation", record.quotation_no, record.customer_name, record);

    setNewCustName("");
    setNewCustPhone("");
    setNewItemDesc("");
    setNewAmount("");
    setNewNotes("");
    setModalOpen(false);
  };

  // Filter Service Jobs for Priya's Queue
  const filteredServiceJobs = useMemo(() => {
    return serviceJobs.filter((j) => {
      // 1. Text Search Filter
      if (q.trim()) {
        const s = q.toLowerCase();
        const name = String(j.customer?.name || "").toLowerCase();
        const jobNo = String(j.jobNo || j.id || "").toLowerCase();
        const phone = String(j.customer?.phone || "").toLowerCase();
        const prod = (j.products || [])
          .map((p) => \`\${p.productName || ""} \${p.makeModel || ""} \${p.serialNo || ""}\`)
          .join(" ")
          .toLowerCase();
        if (!name.includes(s) && !jobNo.includes(s) && !phone.includes(s) && !prod.includes(s)) {
          return false;
        }
      }

      // 2. Stage Filter
      const stage = j.workflow?.stage || "INTAKE_RECEIVED";
      if (serviceStageFilter === "AWAITING_PRICING") {
        return stage === "AWAITING_PRIYA_PRICING";
      }
      if (serviceStageFilter === "AWAITING_MD_APPROVAL") {
        return stage === "AWAITING_MD_APPROVAL";
      }
      if (serviceStageFilter === "PRICE_APPROVED") {
        return stage === "PRICE_APPROVED_BY_MD";
      }
      if (serviceStageFilter === "READY_FOR_HANDOVER") {
        return stage === "READY_FOR_HANDOVER";
      }
      if (serviceStageFilter === "COMPLETED") {
        return stage === "JOB_COMPLETED" || j.status === "CLOSED";
      }

      // Default: Priya sees all service jobs in her workflow scope
      return true;
    });
  }, [serviceJobs, q, serviceStageFilter]);

  // Filter Standard Manual Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((item) => {
      if (selectedFilter !== "ALL" && item.status !== selectedFilter) return false;
      if (!q.trim()) return true;
      const search = q.toLowerCase();
      return (
        item.customer_name.toLowerCase().includes(search) ||
        item.quotation_no.toLowerCase().includes(search) ||
        item.item_description.toLowerCase().includes(search) ||
        (item.customer_city && item.customer_city.toLowerCase().includes(search))
      );
    });
  }, [quotations, q, selectedFilter]);

  // Counts for Badges
  const awaitingPricingCount = useMemo(() => {
    return serviceJobs.filter((j) => j.workflow?.stage === "AWAITING_PRIYA_PRICING").length;
  }, [serviceJobs]);

  const priceApprovedCount = useMemo(() => {
    return serviceJobs.filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD").length;
  }, [serviceJobs]);

  const totalQuotationValue = quotations.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Top Station Selector: Service Jobs vs Standard Quotations */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveStationTab("service_jobs")}
          className={\`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all \${
            activeStationTab === "service_jobs"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }\`}
        >
          <Wrench size={15} />
          <span>Incoming Service Jobs for Pricing &amp; Delivery ({serviceJobs.length})</span>
          {awaitingPricingCount > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {awaitingPricingCount} New
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab("standard_quotations")}
          className={\`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all \${
            activeStationTab === "standard_quotations"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }\`}
        >
          <FileText size={15} />
          <span>Standard Manual Quotations ({quotations.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: SERVICE JOBS QUEUE (AZHALAKU PRIYA PRICING & DISPATCH) */}
      {/* ========================================================================= */}
      {activeStationTab === "service_jobs" && (
        <div className="space-y-4">
          {/* Summary KPI Cards for Servicing */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">Awaiting Priya Pricing</div>
              <div className="text-2xl font-black text-amber-600">{awaitingPricingCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Senthil completed repair</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">MD Approved Quotations</div>
              <div className="text-2xl font-black text-emerald-600">{priceApprovedCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Ready for client dispatch</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">Total Service Records</div>
              <div className="text-2xl font-black text-slate-900">{serviceJobs.length}</div>
              <div className="text-[11px] text-teal-600 font-semibold mt-1">Synced across workshop</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">Standard Benchmark Reference</div>
              <div className="text-sm font-bold text-slate-800">#SJ-2026-1001</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">Texmo Precision Castings Ltd</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
              {[
                { key: "ALL", label: \`All (\${serviceJobs.length})\` },
                { key: "AWAITING_PRICING", label: \`1. Awaiting Pricing (\${awaitingPricingCount})\` },
                { key: "AWAITING_MD_APPROVAL", label: "2. MD Approval" },
                { key: "PRICE_APPROVED", label: \`3. Price Approved (\${priceApprovedCount})\` },
                { key: "READY_FOR_HANDOVER", label: "4. Quotation Dispatched" },
                { key: "COMPLETED", label: "5. Paid & Closed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setServiceStageFilter(tab.key)}
                  className={\`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap \${
                    serviceStageFilter === tab.key
                      ? "bg-white text-teal-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }\`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer, equipment, serial #..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Service Jobs List Cards / Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Job No &amp; Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Equipment &amp; Serial #</th>
                    <th className="py-3 px-4">Senthil Repair Assessment &amp; Scope</th>
                    <th className="py-3 px-4">Quotation / Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServiceJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No service jobs match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredServiceJobs.map((j) => {
                      const firstProd = (j.products && j.products[0]) || {
                        productName: "Service Equipment",
                        makeModel: "",
                        serialNo: "",
                        productValue: 0,
                      };
                      const stage = j.workflow?.stage || "INTAKE_RECEIVED";
                      const approvedPrice =
                        j.workflow?.mdApprovedPrice ||
                        j.workflow?.priyaTotalQuotationAmount ||
                        j.totals?.totalEstimate ||
                        0;

                      return (
                        <tr key={String(j.id || j.jobNo)} className="hover:bg-slate-50/70 transition-colors">
                          {/* Job No */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-teal-800 text-xs">{j.jobNo || j.id}</div>
                            <div className="text-[10.5px] text-slate-400">{j.jobDate || "2026-10-24"}</div>
                          </td>

                          {/* Customer Details */}
                          <td className="py-3 px-4 min-w-[180px]">
                            <div className="font-bold text-slate-900">{j.customer?.name || "Customer"}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {j.customer?.phone || ""} {j.customer?.city ? \`• \${j.customer.city}\` : ""}
                            </div>
                            {j.customer?.contactPerson && (
                              <div className="text-[10px] text-slate-400">Attn: {j.customer.contactPerson}</div>
                            )}
                          </td>

                          {/* Equipment & Serial */}
                          <td className="py-3 px-4 min-w-[190px]">
                            <div className="font-bold text-slate-800">
                              {firstProd.productName} {firstProd.makeModel ? \`(\${firstProd.makeModel})\` : ""}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-mono font-semibold">
                              SN: {firstProd.serialNo || "N/A"}
                            </div>
                            {firstProd.productValue ? (
                              <div className="text-[10.5px] text-slate-400">
                                Base Value: ₹{Number(firstProd.productValue).toLocaleString("en-IN")}
                              </div>
                            ) : null}
                          </td>

                          {/* Senthil's Repair Details & Scope */}
                          <td className="py-3 px-4 max-w-xs">
                            <span
                              className={\`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 \${
                                j.workflow?.mechanicEstimateType === "MAXIMUM_50"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-800"
                              }\`}
                            >
                              {j.workflow?.mechanicEstimateType === "MAXIMUM_50" ? "50% Overhaul" : "30% Standard Scope"}
                            </span>
                            <div className="text-[11px] text-slate-700 font-medium line-clamp-2">
                              {j.workflow?.mechanicAssessment || "Cleaned seals, recalibrated zero and span point."}
                            </div>
                          </td>

                          {/* Quotation / Amount */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-black text-slate-900 text-xs">
                              ₹{Number(approvedPrice).toLocaleString("en-IN")}
                            </div>
                            {j.workflow?.mdApprovedPrice ? (
                              <div className="text-[10px] text-emerald-600 font-bold">✓ MD Approved</div>
                            ) : j.workflow?.priyaTotalQuotationAmount ? (
                              <div className="text-[10px] text-blue-600">Priya Quoted</div>
                            ) : (
                              <div className="text-[10px] text-slate-400">Needs Pricing</div>
                            )}
                          </td>

                          {/* Stage Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={\`inline-flex items-center px-2 py-1 rounded-md text-[10.5px] font-bold \${
                                stage === "AWAITING_PRIYA_PRICING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : stage === "AWAITING_MD_APPROVAL"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : stage === "PRICE_APPROVED_BY_MD"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : stage === "READY_FOR_HANDOVER"
                                  ? "bg-teal-100 text-teal-800 border border-teal-200"
                                  : "bg-slate-100 text-slate-700"
                              }\`}
                            >
                              {stage === "AWAITING_PRIYA_PRICING" && "1. Awaiting Pricing"}
                              {stage === "AWAITING_MD_APPROVAL" && "2. Awaiting MD"}
                              {stage === "PRICE_APPROVED_BY_MD" && "3. Price Approved"}
                              {stage === "READY_FOR_HANDOVER" && "4. Quotation Dispatched"}
                              {stage === "JOB_COMPLETED" && "5. Paid & Closed"}
                              {stage === "INTAKE_RECEIVED" && "Intake"}
                              {stage === "AWAITING_ARAVINDH_ACCEPT" && "Verification"}
                              {stage === "UNDER_REPAIR_SENTHIL" && "Under Repair"}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link
                              href={\`/forms/servicing?id=\${j.jobNo || j.id}\`}
                              className={\`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${
                                stage === "AWAITING_PRIYA_PRICING"
                                  ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                                  : stage === "PRICE_APPROVED_BY_MD"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }\`}
                            >
                              <span>
                                {stage === "AWAITING_PRIYA_PRICING"
                                  ? "Enter Price ➔"
                                  : stage === "PRICE_APPROVED_BY_MD"
                                  ? "Dispatch ➔"
                                  : "Open Job ➔"}
                              </span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: STANDARD MANUAL QUOTATIONS */}
      {/* ========================================================================= */}
      {activeStationTab === "standard_quotations" && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1">Total Quotations</div>
              <div className="text-2xl font-bold text-slate-900">{quotations.length}</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">Real-time local &amp; cloud synced</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1">Total Estimated Value</div>
              <div className="text-2xl font-bold text-slate-900">₹ {totalQuotationValue.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-400 mt-1">Includes 18% GST</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 mb-1">Acceptance Rate</div>
              <div className="text-2xl font-bold text-emerald-600">
                {quotations.length ? Math.round((quotations.filter((x) => x.status === "ACCEPTED").length / quotations.length) * 100) : 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Converted to active work orders</div>
            </div>
          </div>

          {/* Filters, Search, and Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
              {(["ALL", "SENT", "ACCEPTED", "PENDING"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedFilter(tab)}
                  className={\`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer \${
                    selectedFilter === tab
                      ? "bg-white text-slate-900 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }\`}
                >
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search quotations, client..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={15} />
                <span>New Quotation</span>
              </button>
            </div>
          </div>

          {/* Quotations List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4">Quotation No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Item &amp; Scope</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Sent Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotations.length ? (
                    filteredQuotations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {item.quotation_no}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{item.customer_city || "Coimbatore"}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-700 truncate">{item.item_description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {item.scope_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹ {item.total_amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={\`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold \${
                              item.status === "ACCEPTED"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "SENT"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }\`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(item.sent_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewQuotation(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Quotation"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this quotation?")) {
                                  const filtered = quotations.filter((x) => x.id !== item.id);
                                  saveQuotations(filtered);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No quotations found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Quotation Modal */}
      {viewQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewQuotation.quotation_no}</h3>
                <p className="text-xs text-slate-400">Issued on {new Date(viewQuotation.sent_at).toLocaleDateString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewQuotation(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Customer Details</div>
                <div className="text-sm font-bold text-slate-800">{viewQuotation.customer_name}</div>
                <div className="text-slate-600">{viewQuotation.customer_phone}</div>
                <div className="text-slate-500">{viewQuotation.customer_city}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Scope of Work</div>
                <div className="font-semibold text-slate-800">{viewQuotation.item_description}</div>
                <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                  Type: {viewQuotation.scope_type}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Base Amount</span>
                  <span>₹ {viewQuotation.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>₹ {viewQuotation.gst_amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-blue-600">₹ {viewQuotation.total_amount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {viewQuotation.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Terms &amp; Remarks</div>
                  <div className="text-slate-600">{viewQuotation.notes}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} /> Print
              </button>
              <button
                type="button"
                onClick={() => setViewQuotation(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Manual Quotation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Quotation</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Texmo Precision Castings Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98421..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City / Location</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="Coimbatore"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scope Category</label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Calibration">Calibration Services</option>
                  <option value="Servicing">Instrumentation Servicing</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Supply">Direct Supply</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Item &amp; Work Description</label>
                <textarea
                  rows={2}
                  required
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Differential Pressure Transmitter calibration and seal overhaul"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Base Amount (₹ excl. GST)</label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="e.g. 4000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-semibold text-slate-900"
                />
                {newAmount && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    + 18% GST (₹{Math.round(parseFloat(newAmount) * 0.18 || 0)}) = Total:{" "}
                    <strong className="text-blue-600">
                      ₹{Math.round((parseFloat(newAmount) || 0) * 1.18).toLocaleString("en-IN")}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Terms / Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Standard calibration test certificate enclosed."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Create &amp; Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/app/quotations/page.tsx', fileContent, 'utf8');
console.log('Successfully written src/app/quotations/page.tsx');
