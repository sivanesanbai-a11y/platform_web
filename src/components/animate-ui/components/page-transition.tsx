"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

// Polyfill React.addTransitionType if running in standard React 19 without experimental view-transitions
const safeReact = React as Record<string, any>;
if (typeof safeReact.addTransitionType !== "function") {
  safeReact.addTransitionType = () => {};
}

export type PageTransitionEffect = "slide" | "fade" | "zoom" | "blur"

export const controls = {
  PageTransition: {
    effect: {
      options: {
        slide: "slide",
        fade: "fade",
        zoom: "zoom",
        blur: "blur",
      },
    },
  },
}

export interface PageTransitionProps {
  effect?: PageTransitionEffect
  pageKey: string | number
  direction?: "forward" | "back"
  autoHeight?: boolean
  className?: string
  children?: React.ReactNode
}

// Ultra-fast, GPU-accelerated transition variants (transforms & opacity only, 0ms layout thrashing)
const effectVariants = {
  slide: (direction: "forward" | "back") => ({
    initial: {
      opacity: 0,
      x: direction === "forward" ? 8 : -8,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.12,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      x: direction === "forward" ? -8 : 8,
      transition: {
        duration: 0.08,
        ease: "easeIn",
      },
    },
  }),
  fade: () => ({
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.1, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.06, ease: "easeIn" },
    },
  }),
  zoom: () => ({
    initial: { opacity: 0, scale: 0.98 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.12, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 1.01,
      transition: { duration: 0.08, ease: "easeIn" },
    },
  }),
  blur: () => ({
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.1, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.06, ease: "easeIn" },
    },
  }),
}

export function PageTransition({
  effect = "slide",
  pageKey,
  direction = "forward",
  autoHeight = false,
  className,
  children,
}: PageTransitionProps) {
  const variantFn = effectVariants[effect] || effectVariants.slide
  const variants = variantFn(direction)

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={pageKey}
          custom={direction}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          className="w-full"
          style={{
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function PageTransitionShared({
  name,
  className,
  children,
  ...props
}: {
  name: string
  className?: string
  children?: React.ReactNode
} & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      layoutId={name}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
