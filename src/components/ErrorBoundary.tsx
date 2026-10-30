"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {this.props.fallbackTitle || "Something went wrong loading this view"}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            {this.state.error?.message || "A minor display error occurred. Please refresh or reset your session."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
              Reload View
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("nunes:dashboard:last-good:v2");
                  sessionStorage.clear();
                } catch {}
                this.handleReload();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Reset Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
