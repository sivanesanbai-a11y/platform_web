"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} })

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ render, children, ...props }: any) {
  return render || <button type="button" {...props}>{children}</button>
}

export function TooltipContent({
  className,
  side = "right",
  hidden,
  children,
  ...props
}: React.ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left"; align?: string; hidden?: boolean }) {
  const { open } = React.useContext(TooltipContext)
  if (hidden || !open) return null
  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-none whitespace-nowrap",
        side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
        side === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
        side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
        side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
