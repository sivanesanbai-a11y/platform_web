"use client";

import React from "react";
import { 
  ChevronDown, Search, Bell, Check, Plus, MoreVertical,
  Home, CheckSquare, ArrowRightLeft, CreditCard, Landmark, 
  Wallet, GitBranch, Settings
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <div 
      className="w-full rounded-2xl overflow-hidden p-3 md:p-4 text-[11px] select-none pointer-events-none"
      style={{
        background: "rgba(255, 255, 255, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "var(--shadow-dashboard)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="rounded-xl border border-border/70 bg-background/95 overflow-hidden shadow-xs flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-background">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-[10px]">
              N
            </div>
            <span className="font-semibold text-foreground text-xs flex items-center gap-1">
              Nunes <ChevronDown size={12} className="text-muted-foreground" />
            </span>
          </div>

          {/* Search bar with ⌘K */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/70 bg-secondary/40 text-muted-foreground w-64 text-[10.5px]">
            <Search size={12} />
            <span className="flex-1">Search operations...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 text-[9px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium"
            >
              Move Money
            </button>
            <div className="relative text-muted-foreground">
              <Bell size={13} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 text-accent font-semibold flex items-center justify-center text-[10px]">
              JB
            </div>
          </div>
        </div>

        {/* Dashboard Body: Sidebar + Main Content */}
        <div className="flex min-h-[360px]">
          {/* Sidebar */}
          <div className="w-40 flex-shrink-0 border-r border-border/60 p-2.5 flex flex-col justify-between bg-background/50">
            <div className="flex flex-col gap-0.5">
              <div className="px-2 py-1.5 rounded-lg bg-secondary text-foreground font-medium flex items-center gap-2">
                <Home size={12} className="text-foreground" />
                <span>Home</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={12} />
                  <span>Tasks</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full bg-accent/15 text-accent text-[9px] font-semibold">
                  10
                </span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2">
                <ArrowRightLeft size={12} />
                <span>Transactions</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={12} />
                  <span>Payments</span>
                </div>
                <ChevronDown size={10} />
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2">
                <CreditCard size={12} />
                <span>Cards</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2">
                <Landmark size={12} />
                <span>Capital</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={12} />
                  <span>Accounts</span>
                </div>
                <ChevronDown size={10} />
              </div>
            </div>

            {/* Section Workflows */}
            <div className="pt-2 border-t border-border/50 flex flex-col gap-0.5">
              <span className="px-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                Workflows
              </span>
              <div className="px-2 py-1 rounded text-muted-foreground flex items-center gap-2">
                <GitBranch size={11} />
                <span>Trake rutes</span>
              </div>
              <div className="px-2 py-1 rounded text-muted-foreground flex items-center gap-2">
                <CreditCard size={11} />
                <span>Payments</span>
              </div>
              <div className="px-2 py-1 rounded text-muted-foreground flex items-center gap-2">
                <Bell size={11} />
                <span>Notifications</span>
              </div>
              <div className="px-2 py-1 rounded text-muted-foreground flex items-center gap-2">
                <Settings size={11} />
                <span>Settings</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-3.5 bg-secondary/30 flex flex-col gap-3 min-w-0">
            {/* Greeting */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Welcome, Jane
              </h3>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button 
                type="button"
                className="rounded-full px-2.5 py-1 text-[10px] font-medium bg-accent text-accent-foreground shadow-xs"
              >
                Send
              </button>
              {["Request", "Transfer", "Deposit", "Pay Bill", "Create Invoice"].map((act) => (
                <button
                  key={act}
                  type="button"
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium bg-background border border-border/80 text-foreground hover:bg-secondary/60 shadow-xs"
                >
                  {act}
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground font-medium ml-auto">
                + Customize
              </span>
            </div>

            {/* Two Equal-Width Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Balance Card */}
              <div className="rounded-xl border border-border/70 bg-background p-3 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground text-[10.5px] font-medium flex items-center gap-1.5">
                      Mercury Balance
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    </span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    $8,450,190<span className="text-xs text-muted-foreground font-normal">.32</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[9.5px]">
                    <span className="text-muted-foreground">Last 30 Days</span>
                    <span className="text-emerald-600 font-semibold">+$1.8M</span>
                    <span className="text-rose-600 font-semibold">-$900K</span>
                  </div>
                </div>

                {/* Hand-crafted SVG Cubic Bézier Area Chart */}
                <div className="mt-2 h-16 w-full">
                  <svg 
                    viewBox="0 0 360 80" 
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Filled Area */}
                    <path
                      d="M 0,55 C 45,50 75,65 120,42 C 165,18 200,48 245,28 C 290,8 325,24 360,12 L 360,80 L 0,80 Z"
                      fill="url(#balanceGradient)"
                    />
                    {/* Stroke Curve */}
                    <path
                      d="M 0,55 C 45,50 75,65 120,42 C 165,18 200,48 245,28 C 290,8 325,24 360,12"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Accounts Card */}
              <div className="rounded-xl border border-border/70 bg-background p-3 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                  <span className="font-semibold text-foreground text-xs">Accounts</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Plus size={13} />
                    <MoreVertical size={13} />
                  </div>
                </div>
                <div className="flex flex-col py-1">
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground">Credit</span>
                    <span className="font-semibold text-foreground">$98,125.50</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground">Treasury</span>
                    <span className="font-semibold text-foreground">$6,750,200.00</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground">Operations</span>
                    <span className="font-semibold text-foreground">$1,592,864.82</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="rounded-xl border border-border/70 bg-background p-3 shadow-2xs">
              <h4 className="font-semibold text-foreground text-xs mb-2">
                Recent Transactions
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10.5px]">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-[9px] uppercase tracking-wider">
                      <th className="pb-1.5 font-medium">Date</th>
                      <th className="pb-1.5 font-medium">Description</th>
                      <th className="pb-1.5 font-medium">Amount</th>
                      <th className="pb-1.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr>
                      <td className="py-1.5 text-muted-foreground">Today</td>
                      <td className="py-1.5 font-medium text-foreground">AWS</td>
                      <td className="py-1.5 font-semibold text-foreground">-$5,200.00</td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-semibold">
                          Pending
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-muted-foreground">22 Oct</td>
                      <td className="py-1.5 font-medium text-foreground">Client Payment</td>
                      <td className="py-1.5 font-semibold text-emerald-600">+$125,000.00</td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-semibold">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-muted-foreground">21 Oct</td>
                      <td className="py-1.5 font-medium text-foreground">Payroll</td>
                      <td className="py-1.5 font-semibold text-foreground">-$85,450.00</td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-semibold">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-muted-foreground">20 Oct</td>
                      <td className="py-1.5 font-medium text-foreground">Office Supplies</td>
                      <td className="py-1.5 font-semibold text-foreground">-$1,200.00</td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-semibold">
                          Completed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
