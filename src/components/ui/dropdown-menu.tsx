"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextType {
  open: boolean
  setOpen: (v: boolean) => void
}
const DropdownContext = React.createContext<DropdownContextType>({ open: false, setOpen: () => {} })

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ render, children, ...props }: any) {
  const { open, setOpen } = React.useContext(DropdownContext)
  if (render) {
    return React.cloneElement(render, {
      "data-state": open ? "open" : "closed",
      "data-popup-open": open || undefined,
      onClick: (e: any) => {
        render.props?.onClick?.(e)
        setOpen(!open)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  className,
  align = "start",
  side = "bottom",
  children,
  ...props
}: React.ComponentProps<"div"> & { align?: string; side?: string; sideOffset?: number }) {
  const { open } = React.useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={cn(
        "absolute z-50 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1 text-slate-800 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95",
        side === "bottom" && "top-full mt-1.5",
        side === "right" && "left-full ml-1.5 top-0",
        side === "top" && "bottom-full mb-1.5",
        align === "start" ? "left-0" : "right-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-1", className)} {...props} />
}

export function DropdownMenuItem({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(DropdownContext)
  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-slate-500", className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-200/80", className)} {...props} />
}

export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-[10px] tracking-widest text-slate-400", className)} {...props} />
}
