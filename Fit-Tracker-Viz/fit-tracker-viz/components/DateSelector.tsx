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
      <label className="flex items-center gap-1 cursor-pointer" style={{ color: "var(--ft-sub2)", fontSize: 13 }}>
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
      <span className="tabular-nums text-center px-1" style={{ color: "var(--ft-sub2)", fontSize: 13 }}>
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
      <span className="capitalize text-center px-1" style={{ color: "var(--ft-sub2)", fontSize: 13 }}>
        {monthLabel}
      </span>
    )
    onPrev = () => navigate(format(subMonths(base, 1), "yyyy-MM-dd"))
    const nextMonthStart = format(addMonths(startOfMonth(base), 1), "yyyy-MM-dd")
    canGoNext = nextMonthStart <= todayStr
    onNext = () => {
      if (canGoNext) navigate(nextMonthStart)
    }
  }

  const btnStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    color: "var(--ft-sub2)",
    flexShrink: 0,
  }

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2.5 border-b"
      style={{
        borderColor: "var(--ft-border)",
        background: "var(--ft-nav)",
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        style={{ ...btnStyle, opacity: canGoPrev ? 1 : 0.3 }}
        aria-label="Anterior"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <div
        className="flex-1 flex justify-center items-center"
        style={{ fontSize: 13, color: "var(--ft-sub2)", minHeight: "2rem" }}
      >
        {centerLabel}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        style={{ ...btnStyle, opacity: canGoNext ? 1 : 0.3 }}
        aria-label="Siguiente"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function DateSelectorFallback() {
  return (
    <div
      className="h-12 border-b"
      style={{ borderColor: "var(--ft-border)", background: "var(--ft-nav)" }}
    />
  )
}

export default function DateSelector() {
  return (
    <Suspense fallback={<DateSelectorFallback />}>
      <DateSelectorInner />
    </Suspense>
  )
}
