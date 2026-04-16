"use client"

import { Suspense, useCallback, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  format,
  subDays,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  startOfMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  parseDashboardMode,
  formatShortDate,
  resolveDashboardRange,
  today,
} from "@/lib/utils"

function DateSelectorInner() {
  const router = useRouter()
  const params = useSearchParams()
  const todayStr = today()
  const defaultDate = format(subDays(parseISO(todayStr + "T12:00:00"), 1), "yyyy-MM-dd")
  const currentDate = params.get("date") || defaultDate
  const mode = parseDashboardMode(params.get("mode"))

  const navigate = useCallback(
    (date: string) => {
      const p = new URLSearchParams()
      p.set("date", date)
      p.set("mode", mode)
      router.push(`/?${p.toString()}`)
    },
    [router, mode]
  )

  const base = parseISO(currentDate + "T12:00:00")

  let centerLabel: ReactNode
  let canGoPrev = true
  let canGoNext = true
  let onPrev: () => void
  let onNext: () => void

  if (mode === "daily") {
    centerLabel = (
      <label className="flex items-center gap-1 text-sm text-gray-200 cursor-pointer">
        <input
          type="date"
          value={currentDate}
          max={todayStr}
          onChange={(e) => navigate(e.target.value)}
          className="sr-only"
        />
        <span className="tabular-nums">{formatShortDate(currentDate)}</span>
      </label>
    )
    const prevD = format(subDays(base, 1), "yyyy-MM-dd")
    const nextD = format(addDays(base, 1), "yyyy-MM-dd")
    onPrev = () => navigate(prevD)
    onNext = () => {
      if (nextD <= todayStr) navigate(nextD)
    }
    canGoNext = nextD <= todayStr
  } else if (mode === "weekly") {
    const { startDate, endDate } = resolveDashboardRange(currentDate, "weekly")
    centerLabel = (
      <span className="text-sm text-gray-200 tabular-nums text-center px-1">
        {formatShortDate(startDate)} — {formatShortDate(endDate)}
      </span>
    )
    onPrev = () => navigate(format(subWeeks(base, 1), "yyyy-MM-dd"))
    const nextWeekAnchor = format(addWeeks(base, 1), "yyyy-MM-dd")
    const nextRange = resolveDashboardRange(nextWeekAnchor, "weekly")
    canGoNext = nextRange.startDate <= todayStr
    onNext = () => {
      if (canGoNext) navigate(nextWeekAnchor)
    }
  } else {
    const monthLabel = format(base, "MMMM yyyy", { locale: es })
    centerLabel = (
      <span className="text-sm text-gray-200 capitalize text-center px-1">{monthLabel}</span>
    )
    onPrev = () => navigate(format(subMonths(base, 1), "yyyy-MM-dd"))
    const nextMonthStart = format(addMonths(startOfMonth(base), 1), "yyyy-MM-dd")
    canGoNext = nextMonthStart <= todayStr
    onNext = () => {
      if (canGoNext) navigate(nextMonthStart)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-gray-800/80 bg-gray-950/95 max-w-[480px] mx-auto">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className="p-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-30"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 flex justify-center min-h-[2.25rem] items-center">{centerLabel}</div>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function DateSelectorFallback() {
  return <div className="h-12 border-b border-gray-800 max-w-[480px] mx-auto" />
}

export default function DateSelector() {
  return (
    <Suspense fallback={<DateSelectorFallback />}>
      <DateSelectorInner />
    </Suspense>
  )
}
