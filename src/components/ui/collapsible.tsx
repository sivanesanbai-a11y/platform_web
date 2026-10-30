"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleContextType {
  open: boolean
  toggle: () => void
}
const CollapsibleContext = React.createContext<CollapsibleContextType>({ open: false, toggle: () => {} })

export function Collapsible({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const toggle = () => {
    const next = !open
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div data-state={open ? "open" : "closed"} className={cn(open && "group-data-open/collapsible", className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ render, children, ...props }: any) {
  const { toggle } = React.useContext(CollapsibleContext)
  if (render) {
    return React.cloneElement(render, {
      onClick: (e: any) => {
        render.props?.onClick?.(e)
        toggle()
      },
    })
  }
  return (
    <button type="button" onClick={toggle} {...props}>
      {children}
    </button>
  )
}

export function CollapsibleContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open } = React.useContext(CollapsibleContext)
  if (!open) return null
  return (
    <div className={cn("overflow-hidden transition-all duration-200", className)} {...props}>
      {children}
    </div>
  )
}
