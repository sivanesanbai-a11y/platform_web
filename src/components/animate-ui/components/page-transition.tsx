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

// Emil Kowalski / Apple-Design Fluid Motion Curves & Springs
// WWDC 2018 Fluid Interfaces & Design Engineering Principles
const APPLE_EASE_OUT = [0.23, 1, 0.32, 1] as const;

const effectVariants = {
  slide: (direction: "forward" | "back") => ({
    initial: {
      opacity: 0,
      transform: `translateX(${direction === "forward" ? 16 : -16}px) translateZ(0)`,
    },
    animate: {
      opacity: 1,
      transform: "translateX(0px) translateZ(0)",
      transition: {
        type: "spring",
        duration: 0.36,
        bounce: 0, // Critically damped Apple feel (instant start, smooth settle, no oscillation)
      },
    },
    exit: {
      opacity: 0,
      transform: `translateX(${direction === "forward" ? -16 : 16}px) translateZ(0)`,
      transition: {
        duration: 0.16,
        ease: APPLE_EASE_OUT,
      },
    },
  }),
  fade: () => ({
    initial: {
      opacity: 0,
      transform: "scale(0.985) translateZ(0)",
    },
    animate: {
      opacity: 1,
      transform: "scale(1) translateZ(0)",
      transition: {
        duration: 0.2,
        ease: APPLE_EASE_OUT,
      },
    },
    exit: {
      opacity: 0,
      transform: "scale(0.99) translateZ(0)",
      transition: {
        duration: 0.12,
        ease: APPLE_EASE_OUT,
      },
    },
  }),
  zoom: () => ({
    initial: {
      opacity: 0,
      transform: "scale(0.96) translateZ(0)",
    },
    animate: {
      opacity: 1,
      transform: "scale(1) translateZ(0)",
      transition: {
        type: "spring",
        duration: 0.38,
        bounce: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transform: "scale(0.98) translateZ(0)",
      transition: {
        duration: 0.14,
        ease: APPLE_EASE_OUT,
      },
    },
  }),
  blur: () => ({
    initial: {
      opacity: 0,
      filter: "blur(3px)",
      transform: "scale(0.985) translateZ(0)",
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      transform: "scale(1) translateZ(0)",
      transition: {
        duration: 0.22,
        ease: APPLE_EASE_OUT,
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(2px)",
      transform: "scale(0.99) translateZ(0)",
      transition: {
        duration: 0.14,
        ease: APPLE_EASE_OUT,
      },
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
      transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
