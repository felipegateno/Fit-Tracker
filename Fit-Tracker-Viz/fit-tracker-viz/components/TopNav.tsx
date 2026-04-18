"use client"

import { refreshDashboard } from "@/app/actions"
import RefreshButton from "@/components/RefreshButton"
import { parseDashboardMode } from "@/lib/utils"
import type { DashboardMode } from "@/types"
import { format, subDays } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useTransition } from "react"
import { createPortal } from "react-dom"

const MODES: { id: DashboardMode; label: string }[] = [
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
  { id: "monthly", label: "Mensual" },
  { id: "inbody", label: "InBody" },
]

function TopNavContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
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

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refreshDashboard()
      router.refresh()
    })
  }, [router])

  const overlay =
    typeof document !== "undefined" &&
    isPending &&
    createPortal(
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/55 backdrop-blur-sm"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-gray-100 px-4 py-2 rounded-lg bg-gray-900/90 border border-gray-700 shadow-lg">
          Sincronizando…
        </p>
      </div>,
      document.body
    )

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 px-3 py-2.5 relative">
        {isPending && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden pointer-events-none"
            aria-hidden
          >
            <div className="h-full w-full nav-progress-indeterminate" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 max-w-[480px] mx-auto">
          <div className="flex items-center gap-1 min-w-0 shrink-0">
            <span className="text-white font-semibold text-base sm:text-lg tracking-tight">
              Fit Tracker
            </span>
            <RefreshButton isPending={isPending} onClick={handleRefresh} />
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
      {overlay}
    </>
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
