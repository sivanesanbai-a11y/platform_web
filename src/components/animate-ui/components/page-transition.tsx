"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AutoHeight } from "@animate-ui/react/primitives/effects/auto-height"
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

const CUBIC_EASE = [0.16, 1, 0.3, 1] as const

const effectVariants = {
  slide: (direction: "forward" | "back") => ({
    initial: {
      opacity: 0,
      x: direction === "forward" ? 28 : -28,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.28,
        ease: CUBIC_EASE,
      },
    },
    exit: {
      opacity: 0,
      x: direction === "forward" ? -28 : 28,
      transition: {
        duration: 0.2,
        ease: CUBIC_EASE,
      },
    },
  }),
  fade: () => ({
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.16, ease: "easeIn" as const },
    },
  }),
  zoom: () => ({
    initial: { opacity: 0, scale: 0.96 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: CUBIC_EASE },
    },
    exit: {
      opacity: 0,
      scale: 1.03,
      transition: { duration: 0.18, ease: "easeIn" as const },
    },
  }),
  blur: () => ({
    initial: { opacity: 0, filter: "blur(6px)" },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.24, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      filter: "blur(6px)",
      transition: { duration: 0.18, ease: "easeIn" as const },
    },
  }),
}

export function PageTransition({
  effect = "slide",
  pageKey,
  direction = "forward",
  autoHeight = true,
  className,
  children,
}: PageTransitionProps) {
  const variantFn = effectVariants[effect] || effectVariants.slide
  const variants = variantFn(direction)

  const content = (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pageKey}
        custom={direction}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )

  if (!autoHeight) {
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        {content}
      </div>
    )
  }

  return (
    <AutoHeight
      deps={[pageKey]}
      transition={{ duration: 0.32, ease: CUBIC_EASE }}
      className={cn("relative w-full overflow-hidden transition-[height]", className)}
    >
      {content}
    </AutoHeight>
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
      transition={{ duration: 0.32, ease: CUBIC_EASE }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
