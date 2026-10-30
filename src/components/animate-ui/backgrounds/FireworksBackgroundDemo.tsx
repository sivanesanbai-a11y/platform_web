"use client"

import { useTheme } from "next-themes"

import { FireworksBackground } from "@/components/animate-ui/backgrounds/fireworks"

export default function FireworksBackgroundDemo({
  population = 1,
}: {
  population?: number
}) {
  const { resolvedTheme } = useTheme()

  return (
    <FireworksBackground
      className="absolute inset-0"
      color={resolvedTheme === "dark" ? "white" : "black"}
      population={population}
    />
  )
}
