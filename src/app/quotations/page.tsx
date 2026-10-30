"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { syncFormToCloud } from "@/lib/sync";

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
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [q, setQ] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "SENT" | "ACCEPTED" | "PENDING">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<QuotationRecord | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

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

  // Form State for creating new quotation
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCity, setNewCustCity] = useState("Coimbatore");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newScope, setNewScope] = useState<"Calibration" | "Servicing" | "Procurement" | "Supply">("Calibration");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Load purely real data from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nunes:quotations");
      if (raw) {
        const parsed: QuotationRecord[] = JSON.parse(raw);
        // Exclude older fake demo IDs
        const real = parsed.filter(
          (x) => x.id !== "qt-101" && x.id !== "qt-102" && x.id !== "qt-103"
        );
        setQuotations(real);
        localStorage.setItem("nunes:quotations", JSON.stringify(real));
      } else {
        setQuotations([]);
      }
    } catch {
      setQuotations([]);
    }
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
      id: `qt-${Date.now()}`,
      quotation_no: `QT-2026-${String(seq).padStart(4, "0")}`,
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

    // Reset Form
    setNewCustName("");
    setNewCustPhone("");
    setNewItemDesc("");
    setNewAmount("");
    setNewNotes("");
    setModalOpen(false);

    // Show preview of created quotation
    setViewQuotation(record);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      const filtered = quotations.filter((x) => x.id !== id);
      saveQuotations(filtered);
    }
  };

  const filteredQuotations = quotations.filter((item) => {
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

  const totalQuotationValue = quotations.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="w-full p-4 md:p-6 space-y-5 font-sans">
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

      {/* Filters, Search, and Action Bar (integrated neatly without large banner) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/70 text-xs self-stretch sm:self-auto overflow-x-auto">
          {(["ALL", "SENT", "ACCEPTED", "PENDING"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedFilter === tab
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
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
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === "ACCEPTED"
                            ? "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
                            : item.status === "SENT"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(item.sent_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewQuotation(item)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Quotation"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No Quotations Yet</p>
                      <p className="text-xs text-slate-400">
                        Click &ldquo;New Quotation&rdquo; above to generate your first quotation or dispatch one from the order forms.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW QUOTATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FilePlus size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Create &amp; Dispatch Quotation</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer / Organization *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Roots Industries India Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98421..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="Coimbatore"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Service Scope</label>
                  <select
                    value={newScope}
                    onChange={(e: any) => setNewScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Calibration">NABL Calibration</option>
                    <option value="Servicing">Servicing &amp; Repair</option>
                    <option value="Supply">Equipment Supply</option>
                    <option value="Procurement">Procurement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Base Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Scope &amp; Item Details *</label>
                <textarea
                  required
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Precision calibration of Digital Pressure Gauges..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Terms</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Standard NUNES Calibration &amp; Servicing terms apply."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {newAmount && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">+ 18% GST: ₹ {Math.round(parseFloat(newAmount) * 0.18 || 0).toLocaleString("en-IN")}</span>
                  <span className="font-bold text-slate-900">Total: ₹ {(parseFloat(newAmount) + Math.round(parseFloat(newAmount) * 0.18 || 0)).toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Save &amp; Generate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT FORMAL QUOTATION MODAL */}
      {viewQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Commercial Quotation Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs flex items-center gap-1 cursor-pointer"
                  title="Print"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewQuotation(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Formal Quotation Paper Preview */}
            <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-5 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">NUNES INSTRUMENTATION</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Coimbatore, Tamil Nadu • NABL Calibration &amp; Supply Facility</p>
                  <p className="text-[10px] text-slate-500">GSTIN: 33AAACN1234N1Z5 • Phone: +91 422 249 8800</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-blue-600">{viewQuotation.quotation_no}</div>
                  <div className="text-[10px] text-slate-400">Date: {new Date(viewQuotation.sent_at).toLocaleDateString("en-IN")}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">Status: {viewQuotation.status}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Quotation To</span>
                  <div className="font-bold text-slate-900">{viewQuotation.customer_name}</div>
                  <div className="text-slate-500">{viewQuotation.customer_city}</div>
                  <div className="text-slate-500">{viewQuotation.customer_phone}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Validity</span>
                  <div className="font-medium text-slate-700">Valid for 30 Days</div>
                  <div className="text-slate-500 text-[10px]">Expiry: {new Date(viewQuotation.valid_until).toLocaleDateString("en-IN")}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Scope / Description</th>
                      <th className="p-2.5 text-center">Type</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-2.5 font-medium">{viewQuotation.item_description}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">{viewQuotation.scope_type}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold">₹ {viewQuotation.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50/60 font-semibold">
                    <tr>
                      <td colSpan={2} className="p-2 text-right text-slate-500">Base Subtotal:</td>
                      <td className="p-2 text-right font-mono">₹ {viewQuotation.amount.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="p-2 text-right text-slate-500">Applicable GST (18%):</td>
                      <td className="p-2 text-right font-mono">₹ {viewQuotation.gst_amount.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr className="text-sm border-t border-slate-200 font-bold text-slate-900 bg-blue-50/50">
                      <td colSpan={2} className="p-2.5 text-right">Grand Total:</td>
                      <td className="p-2.5 text-right font-mono text-blue-700">₹ {viewQuotation.total_amount.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-500">
                <div className="font-bold text-slate-700 mb-0.5">Terms &amp; Conditions</div>
                <p>{viewQuotation.notes || "Standard NUNES Calibration &amp; Servicing terms apply. Payment within 30 days."}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400">Authorized Signatory • NUNES Instrumentation</div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${(viewQuotation.customer_phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello ${viewQuotation.customer_name}, please find Quotation ${viewQuotation.quotation_no} from NUNES Instrumentation for ₹ ${viewQuotation.total_amount.toLocaleString("en-IN")}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp Quote</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = quotations.map((q) => (q.id === viewQuotation.id ? { ...q, status: "ACCEPTED" as const } : q));
                      saveQuotations(updated);
                      setViewQuotation({ ...viewQuotation, status: "ACCEPTED" });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark Accepted</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Full Resolution Media Preview Modal */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg cursor-pointer"
            >
              <X size={16} />
            </button>
            <img src={previewMediaUrl} alt="Preview" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
