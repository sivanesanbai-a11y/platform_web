"use client"

import * as React from "react"
import { AutoHeight as AutoHeightPrimitive, type AutoHeightProps } from "@animate-ui/react/primitives/effects/auto-height"
import { cn } from "@/lib/utils"

export { AutoHeightPrimitive }
export type { AutoHeightProps }

export function AutoHeight({
  children,
  deps,
  className,
  transition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  ...props
}: AutoHeightProps) {
  const Component = AutoHeightPrimitive as React.ComponentType<any>
  return (
    <Component
      deps={deps}
      transition={transition}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export default AutoHeight
