"use client"

import * as React from "react"

import {
  PageTransition,
  PageTransitionShared,
  type PageTransitionEffect,
  controls,
} from "@/components/animate-ui/components/page-transition"

const PAGES = [
  {
    title: "Home",
    text: "Animated primitives for Radix UI, Base UI and React Aria.",
    tone: "bg-sky-100 text-sky-900",
  },
  {
    title: "Docs",
    text: "Swap the import and your shadcn/ui components animate.",
    tone: "bg-amber-100 text-amber-900",
  },
  {
    title: "Blog",
    text: "Animate UI 2.0 is out, with a CLI and a skill.",
    tone: "bg-emerald-100 text-emerald-900",
  },
]

const EFFECTS = Object.keys(
  controls.PageTransition.effect.options,
) as PageTransitionEffect[]

export default function PageTransitionDemo({
  effect = "slide",
  shared = true,
  picker = true,
}: {
  effect?: PageTransitionEffect
  shared?: boolean
  picker?: boolean
}) {
  const [page, setPage] = React.useState(0)
  const [chosen, setChosen] = React.useState(effect)
  const [prop, setProp] = React.useState(effect)
  if (effect !== prop) {
    setProp(effect)
    setChosen(effect)
  }

  const go = (next: number) => {
    if (next === page) return
    React.startTransition(() => {
      const safe = React as Record<string, any>
      if (typeof safe.addTransitionType === "function") {
        safe.addTransitionType(next > page ? "nav-forward" : "nav-back")
      }
      setPage(next)
    })
  }

  const current = PAGES[page]!

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {picker && (
        <div
          role="radiogroup"
          aria-label="Effect"
          className="flex flex-wrap justify-center gap-1"
        >
          {EFFECTS.map((name) => (
            <button
              key={name}
              role="radio"
              aria-checked={chosen === name}
              onClick={() => setChosen(name)}
              className="rounded-md border px-2.5 py-1 font-mono text-xs text-slate-600 transition-colors hover:text-slate-900 aria-checked:border-slate-900 aria-checked:bg-slate-900 aria-checked:text-white"
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="w-full overflow-hidden rounded-xl border bg-white">
        <nav className="flex gap-1 border-b p-2">
          {PAGES.map((item, index) => (
            <button
              key={item.title}
              onClick={() => go(index)}
              aria-current={index === page ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900 aria-[current=page]:bg-slate-100 aria-[current=page]:font-bold aria-[current=page]:text-slate-900"
            >
              {item.title}
            </button>
          ))}
        </nav>
        <PageTransition
          effect={chosen}
          pageKey={page}
          direction={page > 0 ? "forward" : "back"}
          className={`relative flex h-64 flex-col justify-end gap-1.5 p-6 ${current.tone}`}
        >
          {shared && page < 2 && (
            <PageTransitionShared
              name="page-transition-demo-cover"
              className={
                page === 0
                  ? "absolute top-6 right-6 size-16 rounded-xl bg-blue-600"
                  : "absolute inset-x-6 top-6 h-20 rounded-lg bg-blue-600"
              }
            />
          )}
          <h2 className="text-2xl font-medium">{current.title}</h2>
          <p className="text-sm opacity-80">{current.text}</p>
        </PageTransition>
      </div>
    </div>
  )
}
