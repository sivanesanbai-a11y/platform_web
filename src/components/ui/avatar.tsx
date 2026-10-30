"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Avatar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt, className, ...props }: React.ComponentProps<"img">) {
  const [error, setError] = React.useState(!src)
  if (error || !src) return null
  return (
    <img
      src={src}
      alt={alt || "Avatar"}
      onError={() => setError(true)}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
}

export function AvatarFallback({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 select-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}
