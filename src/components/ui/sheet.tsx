"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => onOpenChange?.(false)} />
      {children}
    </div>
  )
}

export function SheetContent({
  className,
  children,
  side = "left",
  style,
  ...props
}: React.ComponentProps<"div"> & { side?: "left" | "right" | "top" | "bottom" }) {
  return (
    <div
      style={style}
      className={cn(
        "fixed z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out inset-y-0",
        side === "left" && "left-0",
        side === "right" && "right-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />
}

export function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />
}
