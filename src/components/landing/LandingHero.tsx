"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Play, Shield, Sparkles, Wrench, X } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

export default function LandingHero() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <section className="relative flex-1 flex flex-col items-center w-full overflow-y-auto bg-white select-none">
      {/* Crisp White Minimalist Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#000000 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 pt-6 md:pt-10 pb-16 max-w-7xl mx-auto">
        {/* 1. Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 mb-5 shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>NUNES Operations Platform · Official Enterprise Edition</span>
        </motion.div>

        {/* 2. Headline: Crisp Black Display Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-center font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] leading-[1.02] tracking-tight text-slate-950 max-w-3xl"
        >
          The Future of{" "}
          <span className="font-display italic font-normal text-slate-900 underline decoration-blue-500/30 underline-offset-8">
            Industrial
          </span>{" "}
          Operations &amp; Servicing
        </motion.h1>

        {/* 3. Subheadline: Dark Slate High-Readability Font */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-4 text-center text-sm sm:text-base md:text-lg text-slate-600 max-w-[680px] leading-relaxed font-sans font-normal"
        >
          Automate calibration workflows, purchasing orders, official GST quotations, and customer dispatches with real-time tracking across Coimbatore and India.
        </motion.p>

        {/* 4. Action Buttons: Redirect to Dashboard and Forms */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 font-sans"
        >
          <Link
            href="/"
            className="rounded-xl px-6 py-3 text-sm font-bold bg-slate-950 text-white hover:bg-slate-800 shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>Open Dashboard</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/forms"
            className="rounded-xl px-5 py-3 text-sm font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all inline-flex items-center gap-2"
          >
            <Wrench size={15} className="text-blue-600" />
            <span>Launch Forms Hub</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            aria-label="View overview preview"
            className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
            <span>Watch Demo</span>
          </button>
        </motion.div>

        {/* Highlights Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Zero Data Loss Guaranteed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Instant PDF Quotations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Google Cloud Backup Ready</span>
          </div>
        </div>

        {/* 5. Live Interactive Dashboard Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 w-full max-w-5xl"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 shadow-xl">
            <DashboardPreview />
          </div>
        </motion.div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowDemoModal(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">NUNES Operations Overview</h3>
              <button 
                type="button" 
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3">
                <Play size={20} className="fill-white ml-0.5" />
              </div>
              <h4 className="font-bold text-base">Direct Real-Time Operations</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                All Servicing Jobs and Purchasing Orders are saved automatically to local persistent storage and your Google Account.
              </p>
              <Link 
                href="/" 
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors"
              >
                Go to Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
