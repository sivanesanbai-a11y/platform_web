"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  CheckSquare,
  Activity,
  Wrench,
  ShoppingCart,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Sparkles,
  Search,
  X,
  ArrowRight,
} from "lucide-react";
import type { ServiceJob } from "@/types/service-job";
import type { PurchasingOrder } from "@/types/purchasing-order";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  title: string;
  category: "Navigation" | "Recent Forms" | "Operations";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  shortcut?: string;
  subtitle?: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: "dashboard", title: "Dashboard", category: "Navigation", icon: LayoutGrid, href: "/dashboard", shortcut: "G D" },
  { id: "tasks", title: "My tasks", category: "Navigation", icon: CheckSquare, href: "/tasks", shortcut: "G T" },
  { id: "activity", title: "Activity", category: "Navigation", icon: Activity, href: "/activity", shortcut: "G A" },
  { id: "forms", title: "Forms", category: "Operations", icon: FileText, href: "/forms", shortcut: "G F", subtitle: "All-in-one servicing & purchasing forms hub" },
  { id: "quotations", title: "Quotations", category: "Operations", icon: FileText, href: "/quotations", shortcut: "G Q", subtitle: "Quotation generator & sent records" },
  { id: "customers", title: "Customers", category: "Operations", icon: Users, href: "/customers", shortcut: "G C", subtitle: "Customer directory & service history" },
  { id: "suppliers", title: "Suppliers", category: "Operations", icon: Package, href: "/suppliers", subtitle: "Vendor directory & component suppliers" },
  { id: "reports", title: "Reports", category: "Navigation", icon: BarChart3, href: "/reports", shortcut: "G R" },
  { id: "settings", title: "Settings", category: "Navigation", icon: Settings, href: "/settings", shortcut: "G S" },
];

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic items from saved forms
  const [dynamicItems, setDynamicItems] = useState<PaletteItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const results: PaletteItem[] = [];

      // Service jobs
      const rawService = localStorage.getItem("nunes:service_jobs");
      if (rawService) {
        const list: ServiceJob[] = JSON.parse(rawService);
        list.slice(0, 5).forEach((j) => {
          results.push({
            id: `service-${j.id}`,
            title: `${j.jobNo || j.id} · ${j.customer?.name || "Customer"}`,
            category: "Recent Forms",
            icon: Wrench,
            href: `/forms/servicing?id=${j.id}`,
            subtitle: `Service Job · Status: ${j.status || "DRAFT"}`,
          });
        });
      }

      // Purchasing orders
      const rawPurchase = localStorage.getItem("nunes:purchasing_orders");
      if (rawPurchase) {
        const list: PurchasingOrder[] = JSON.parse(rawPurchase);
        list.slice(0, 5).forEach((p) => {
          results.push({
            id: `purchase-${p.id}`,
            title: `${p.order_id || p.id} · ${p.customer_name || "Customer"}`,
            category: "Recent Forms",
            icon: ShoppingCart,
            href: `/forms/purchasing?id=${p.id}`,
            subtitle: `Purchasing Order · ₹ ${Number(p.total_order_value || 0).toLocaleString("en-IN")}`,
          });
        });
      }

      setDynamicItems(results);
    } catch {}
  }, [isOpen]);

  // Combined and filtered items
  const allItems = [...STATIC_ITEMS, ...dynamicItems];
  const filteredItems = query.trim() === ""
    ? allItems
    : allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search size={16} className="text-slate-400 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, forms, customers..."
            className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching pages, forms, or records found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-400 truncate">{item.subtitle}</span>
                      )}
                    </div>
                  </div>

                  {item.shortcut && (
                    <div className="flex items-center gap-1 font-mono text-[10px] font-semibold text-slate-400 ml-2">
                      {item.shortcut.split(" ").map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd className="px-1 py-0.2 rounded bg-white border border-slate-200 text-[10px]">↑</kbd>
            <kbd className="px-1 py-0.2 rounded bg-white border border-slate-200 text-[10px]">↓</kbd>
            <span>Select</span>
            <kbd className="px-1 py-0.2 rounded bg-white border border-slate-200 text-[10px]">↵</kbd>
          </div>
          <span>NUNES Operations</span>
        </div>
      </div>
    </div>
  );
}
