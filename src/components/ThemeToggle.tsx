"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export interface ThemeToggleProps {
  className?: string;
  variant?: "segmented" | "compact";
}

export default function ThemeToggle({
  className = "",
  variant = "segmented",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`}
      >
        <div className="h-6 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all cursor-pointer ${
          isDark
            ? "bg-slate-900 border-slate-700 text-blue-400 hover:bg-slate-800 shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
        } ${className}`}
        title={isDark ? "Switch to Light Mode" : "Switch to Black Mode"}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Black Mode"}
      >
        {isDark ? <Moon size={15} /> : <Sun size={15} className="text-blue-600" />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme mode toggle"
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-none shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
          !isDark
            ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
        }`}
        title="Switch to Light Theme"
      >
        <Sun
          size={12}
          className={!isDark ? "text-blue-600" : "text-slate-400"}
        />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
          isDark
            ? "bg-blue-600 text-white shadow-xs border border-blue-500"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 border border-transparent"
        }`}
        title="Switch to Black Theme"
      >
        <Moon
          size={12}
          className={isDark ? "text-white" : "text-slate-500"}
        />
        <span>Black</span>
      </button>
    </div>
  );
}
