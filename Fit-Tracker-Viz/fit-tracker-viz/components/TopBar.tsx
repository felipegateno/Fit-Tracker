"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { parseDashboardMode } from "@/lib/utils"

interface FtUser {
  id: string
  name: string
  initials: string
  color: string
}

const TAB_TITLES: Record<string, string> = {
  daily: "Hoy",
  weekly: "Semana",
  monthly: "Mes",
  inbody: "InBody",
}

export default function TopBar() {
  const router = useRouter()
  const params = useSearchParams()
  const mode = parseDashboardMode(params.get("mode"))
  const [user, setUser] = useState<FtUser | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ft_user")
      if (stored) setUser(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const handleUserClick = () => {
    router.push("/select-user")
  }

  return (
    <nav
      className="flex-shrink-0 sticky top-0 z-50 border-b flex items-center justify-between px-4 py-2.5"
      style={{
        background: "var(--ft-nav)",
        borderColor: "var(--ft-border)",
        height: 52,
      }}
    >
      {/* Left: user avatar */}
      <button
        onClick={handleUserClick}
        className="flex items-center gap-2 min-w-0"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        {user ? (
          <>
            <div
              className="flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                background: `${user.color}18`,
                border: `2px solid ${user.color}55`,
                color: user.color,
              }}
            >
              {user.initials}
            </div>
            <span className="text-ft-text font-semibold text-sm">{user.name}</span>
          </>
        ) : (
          <div
            className="flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0"
            style={{
              width: 30,
              height: 30,
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.15)",
              color: "var(--ft-sub2)",
            }}
          >
            ?
          </div>
        )}
      </button>

      {/* Center: tab title */}
      <span className="text-ft-sub2 text-sm font-medium absolute left-1/2 -translate-x-1/2">
        {TAB_TITLES[mode] ?? "Hoy"}
      </span>

      {/* Right: sync indicator */}
      <div className="flex items-center gap-1.5">
        <div
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "var(--ft-green)",
            boxShadow: "0 0 6px var(--ft-green)",
          }}
        />
        <span className="text-ft-sub text-xs">sync</span>
      </div>
    </nav>
  )
}
