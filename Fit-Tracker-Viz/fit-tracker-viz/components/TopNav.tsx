"use client"

import { Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, subDays, addDays, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PRESETS = [
  { label: "Hoy", days: "1" },
  { label: "7 días", days: "7" },
  { label: "30 días", days: "30" },
]

function TopNavContent() {
  const router = useRouter()
  const params = useSearchParams()
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const currentDate =
    params.get("date") || format(subDays(new Date(), 1), "yyyy-MM-dd")
  const currentDays = params.get("days") || "1"

  const navigate = useCallback(
    (date: string, days: string) => {
      const p = new URLSearchParams()
      p.set("date", date)
      p.set("days", days)
      router.push(`/?${p.toString()}`)
    },
    [router]
  )

  const base = parseISO(currentDate + "T12:00:00")
  const prevDate = format(subDays(base, 1), "yyyy-MM-dd")
  const nextDate = format(addDays(base, 1), "yyyy-MM-dd")
  const canGoNext = nextDate <= todayStr

  return (
    <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 px-4 py-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-white font-semibold text-lg tracking-tight shrink-0">
            Fit Tracker
          </span>
          <span className="text-xs text-gray-400 font-normal hidden sm:inline">
            dashboard
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => navigate(prevDate, currentDays)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={currentDate}
            max={todayStr}
            onChange={(e) => navigate(e.target.value, currentDays)}
            className="px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 max-w-[9.5rem]"
          />
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => canGoNext && navigate(nextDate, currentDays)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {PRESETS.map(({ label, days }) => {
          const isActive = currentDays === days
          return (
            <button
              key={label}
              type="button"
              onClick={() =>
                navigate(days === "1" ? todayStr : currentDate, days)
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function TopNavFallback() {
  return (
    <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 px-4 py-3 h-[88px]" />
  )
}

export default function TopNav() {
  return (
    <Suspense fallback={<TopNavFallback />}>
      <TopNavContent />
    </Suspense>
  )
}
