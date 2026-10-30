"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";

export default function LandingNavbar() {
  return (
    <header className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 font-sans bg-white border-b border-slate-200/90 relative z-20 w-full select-none">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
            N
          </span>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">Nunes</span>
          <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            Operations Platform
          </span>
        </span>
      </Link>

      {/* Right: Nav Links (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-7">
        <Link 
          href="/" 
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
        >
          <LayoutGrid size={14} />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/forms" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Forms Hub
        </Link>
        <Link 
          href="/forms/servicing" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Servicing
        </Link>
        <Link 
          href="/forms/purchasing" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Purchasing
        </Link>
        <Link 
          href="/quotations" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Quotations
        </Link>
        <Link 
          href="/reports" 
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Reports
        </Link>
      </nav>

      {/* CTA Button: Redirects directly to Dashboard */}
      <div className="flex items-center gap-3">
        <Link 
          href="/"
          className="rounded-xl px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all inline-flex items-center gap-1.5"
        >
          <span>Open Dashboard</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  );
}
