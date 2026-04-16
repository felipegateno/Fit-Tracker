"use client"

import { Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, subDays } from "date-fns"
import { parseDashboardMode } from "@/lib/utils"
import type { DashboardMode } from "@/types"

const MODES: { id: DashboardMode; label: string }[] = [
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
  { id: "monthly", label: "Mensual" },
]

function TopNavContent() {
  const router = useRouter()
  const params = useSearchParams()
  const currentDate =
    params.get("date") || format(subDays(new Date(), 1), "yyyy-MM-dd")
  const mode = parseDashboardMode(params.get("mode"))

  const navigateMode = useCallback(
    (next: DashboardMode) => {
      const p = new URLSearchParams()
      p.set("date", currentDate)
      p.set("mode", next)
      router.push(`/?${p.toString()}`)
    },
    [router, currentDate]
  )

  return (
    <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 max-w-[480px] mx-auto">
        <div className="flex items-baseline gap-2 min-w-0 shrink-0">
          <span className="text-white font-semibold text-base sm:text-lg tracking-tight">
            Fit Tracker
          </span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigateMode(id)}
              className={`px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                mode === id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

function TopNavFallback() {
  return (
    <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 px-3 py-2.5 h-[52px]" />
  )
}

export default function TopNav() {
  return (
    <Suspense fallback={<TopNavFallback />}>
      <TopNavContent />
    </Suspense>
  )
}
