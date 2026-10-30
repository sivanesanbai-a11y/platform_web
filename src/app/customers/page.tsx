"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";

export interface CustomerProfile {
  id: string;
  name: string;
  city: string;
  phone: string;
  email?: string;
  total_jobs: number;
  total_value: number;
  last_service: string;
  status: "ACTIVE" | "VERIFIED" | "IN_REVIEW";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Aggregate customers purely from real localStorage data (jobs, orders, quotations, custom)
  const refreshCustomers = () => {
    try {
      const sRaw = localStorage.getItem("nunes:service_jobs");
      const pRaw = localStorage.getItem("nunes:purchasing_orders");
      const qRaw = localStorage.getItem("nunes:quotations");
      const cRaw = localStorage.getItem("nunes:customers");

      const sJobs = sRaw ? JSON.parse(sRaw) : [];
      const pOrders = pRaw ? JSON.parse(pRaw) : [];
      const quotes = qRaw ? JSON.parse(qRaw) : [];
      const customCust: CustomerProfile[] = cRaw ? JSON.parse(cRaw) : [];

      const map = new Map<string, CustomerProfile>();

      // 1. Custom added customers
      if (Array.isArray(customCust)) {
        customCust.forEach((c) => {
          if (c && c.name) {
            map.set(c.name.trim().toLowerCase(), {
              ...c,
              total_jobs: Number(c.total_jobs) || 0,
              total_value: Number(c.total_value) || 0,
            });
          }
        });
      }

      // 2. Extract from live service jobs
      if (Array.isArray(sJobs)) {
        sJobs.forEach((j: any) => {
          const rawName = String(j.customer?.name || j.customer_name || "").trim();
          if (!rawName) return;
          const key = rawName.toLowerCase();
          const jobTotal = Number(j.charges?.total || j.total_amount || 0);

          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.total_jobs += 1;
            existing.total_value += jobTotal;
            if (!existing.phone && j.customer?.phone) existing.phone = j.customer.phone;
            if (!existing.email && j.customer?.email) existing.email = j.customer.email;
            if (!existing.city && (j.customer?.address || j.customer?.city)) {
              existing.city = j.customer.address || j.customer.city;
            }
          } else {
            map.set(key, {
              id: `c-srv-${Date.now()}-${Math.random()}`,
              name: rawName,
              city: j.customer?.address || j.customer?.city || "—",
              phone: j.customer?.phone || "—",
              email: j.customer?.email || "",
              total_jobs: 1,
              total_value: jobTotal,
              last_service: "Servicing Job",
              status: "ACTIVE",
            });
          }
        });
      }

      // 3. Extract from live purchasing orders
      if (Array.isArray(pOrders)) {
        pOrders.forEach((p: any) => {
          const rawName = String(p.customer_name || "").trim();
          if (!rawName) return;
          const key = rawName.toLowerCase();
          const poTotal = Number(p.total_order_value || p.total_amount || 0);

          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.total_jobs += 1;
            existing.total_value += poTotal;
          } else {
            map.set(key, {
              id: `c-po-${Date.now()}-${Math.random()}`,
              name: rawName,
              city: p.city || "—",
              phone: p.customer_phone || p.phone || "—",
              email: p.email || "",
              total_jobs: 1,
              total_value: poTotal,
              last_service: "Purchase Order",
              status: "ACTIVE",
            });
          }
        });
      }

      // 4. Extract from live quotations
      if (Array.isArray(quotes)) {
        quotes.forEach((qt: any) => {
          const rawName = String(qt.customer_name || "").trim();
          if (!rawName) return;
          const key = rawName.toLowerCase();
          const quoteTotal = Number(qt.total_amount || 0);

          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.total_value += quoteTotal;
            if (existing.city === "—" && qt.customer_city) existing.city = qt.customer_city;
            if (existing.phone === "—" && qt.customer_phone) existing.phone = qt.customer_phone;
          } else {
            map.set(key, {
              id: `c-qt-${Date.now()}-${Math.random()}`,
              name: rawName,
              city: qt.customer_city || "—",
              phone: qt.customer_phone || "—",
              email: qt.customer_email || "",
              total_jobs: 1,
              total_value: quoteTotal,
              last_service: "Quotation",
              status: "ACTIVE",
            });
          }
        });
      }

      setCustomers(Array.from(map.values()));
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCustomer: CustomerProfile = {
      id: `cust-${Date.now()}`,
      name: newName.trim(),
      city: newCity.trim() || "—",
      phone: newPhone.trim() || "—",
      email: newEmail.trim() || "",
      total_jobs: 0,
      total_value: 0,
      last_service: "New Client",
      status: "ACTIVE",
    };

    try {
      const cRaw = localStorage.getItem("nunes:customers");
      const existing = cRaw ? JSON.parse(cRaw) : [];
      const updated = [newCustomer, ...(Array.isArray(existing) ? existing : [])];
      localStorage.setItem("nunes:customers", JSON.stringify(updated));
    } catch {}

    setNewName("");
    setNewCity("");
    setNewPhone("");
    setNewEmail("");
    setModalOpen(false);
    refreshCustomers();
  };

  const handleDeleteCustomer = (nameToDelete: string) => {
    if (!confirm(`Remove client record for "${nameToDelete}"?`)) return;
    try {
      const cRaw = localStorage.getItem("nunes:customers");
      if (cRaw) {
        const existing = JSON.parse(cRaw);
        if (Array.isArray(existing)) {
          const filtered = existing.filter((c: any) => c.name.toLowerCase() !== nameToDelete.toLowerCase());
          localStorage.setItem("nunes:customers", JSON.stringify(filtered));
        }
      }
    } catch {}
    setCustomers((prev) => prev.filter((c) => c.name.toLowerCase() !== nameToDelete.toLowerCase()));
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.city.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.includes(q)
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-5 font-sans">
      {/* Real Live KPI Metrics - Zero Fake Data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Active Clients</div>
          <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Real active customer directory</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Work Orders &amp; Jobs</div>
          <div className="text-2xl font-bold text-slate-900">
            {customers.reduce((acc, c) => acc + c.total_jobs, 0)} orders
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Aggregated across all operations</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Commercial Pipeline</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹ {customers.reduce((acc, c) => acc + c.total_value, 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total customer value recorded</div>
        </div>
      </div>

      {/* Action Toolbar: Search, View Switcher & Add Customer Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients by name, city, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Table
            </button>
          </div>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table or Cards Grid, or Clean Zero-Data Empty State */}
      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{item.city}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 py-2 border-y border-slate-100 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-medium text-slate-700">{item.phone}</span>
                    </div>
                    {item.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[170px]" title={item.email}>
                          {item.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Work Orders:</span>
                      <span className="font-bold text-slate-800">{item.total_jobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Recorded Value:</span>
                      <span className="font-bold text-blue-600">
                        ₹ {item.total_value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/forms/servicing?customer=${encodeURIComponent(item.name)}`}
                      className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                      title="New Job Card"
                    >
                      <Wrench size={12} />
                      <span>Job</span>
                    </Link>
                    <span className="text-slate-300">|</span>
                    <Link
                      href={`/quotations?customer=${encodeURIComponent(item.name)}`}
                      className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                      title="New Quotation"
                    >
                      <FileText size={12} />
                      <span>Quote</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(item.name)}
                    className="text-slate-300 hover:text-red-600 transition-colors p-1"
                    title="Remove client"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">City / Location</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.city}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{item.phone}</td>
                      <td className="py-3 px-4 text-slate-500">{item.email || "—"}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.total_jobs}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        ₹ {item.total_value.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            href={`/forms/servicing?customer=${encodeURIComponent(item.name)}`}
                            className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Wrench size={12} />
                            <span>Job</span>
                          </Link>
                          <Link
                            href={`/quotations?customer=${encodeURIComponent(item.name)}`}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                          >
                            <FileText size={12} />
                            <span>Quote</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(item.name)}
                            className="text-slate-300 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Users size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {q ? "No matching clients found" : "No client records registered yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            {q
              ? `No registered clients matched "${q}". Clear the search query or add a new customer record.`
              : "Clients will appear here automatically when you create Servicing Job Cards or Quotations, or you can register one now."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Customer</span>
            </button>
            <Link
              href="/forms/servicing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Wrench size={14} className="text-blue-600" />
              <span>New Servicing Job Card</span>
            </Link>
            <Link
              href="/quotations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <FileText size={14} className="text-emerald-600" />
              <span>New Quotation</span>
            </Link>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Customer Record</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Company / Client Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Industries Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">City / Location</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Coimbatore, Tamil Nadu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 98421..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. contact@client.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
