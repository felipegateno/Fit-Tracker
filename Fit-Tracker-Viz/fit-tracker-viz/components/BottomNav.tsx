"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { format, subDays } from "date-fns"
import { parseDashboardMode } from "@/lib/utils"
import type { DashboardMode } from "@/types"

const TABS: { id: DashboardMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "daily",
    label: "Hoy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "weekly",
    label: "Semana",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="6" width="3" height="9" rx="1.5" fill="currentColor" fillOpacity="0.5" />
        <rect x="8.5" y="4" width="3" height="13" rx="1.5" fill="currentColor" />
        <rect x="14" y="8" width="3" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7" />
      </svg>
    ),
  },
  {
    id: "monthly",
    label: "Mes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.6" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.6" />
      </svg>
    ),
  },
  {
    id: "inbody",
    label: "Body",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="2.2" fill="currentColor" />
        <path d="M7 8h6l-1 4.5-1 4h-2l-1-4z" fill="currentColor" fillOpacity="0.75" />
        <path d="M5 9.5l2 2.5M15 9.5l-2 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const router = useRouter()
  const params = useSearchParams()
  const mode = parseDashboardMode(params.get("mode"))
  const currentDate =
    params.get("date") || format(subDays(new Date(), 1), "yyyy-MM-dd")

  const navigate = (next: DashboardMode) => {
    const p = new URLSearchParams()
    p.set("date", currentDate)
    p.set("mode", next)
    router.push(`/?${p.toString()}`)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ background: "var(--ft-nav)", borderTop: "1px solid var(--ft-border)" }}
    >
      <div className="flex w-full max-w-[430px] mx-auto">
        {TABS.map((tab) => {
          const active = mode === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: active ? "var(--ft-accent)" : "var(--ft-sub)",
                transition: "color 0.2s",
              }}
            >
              {tab.icon}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>
                {tab.label}
              </span>
              {active && (
                <div
                  style={{
                    width: 16,
                    height: 2,
                    borderRadius: 1,
                    background: "var(--ft-accent)",
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
