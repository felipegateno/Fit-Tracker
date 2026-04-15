"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"

const PRESETS = [
  { label: "Hoy", days: 0 },
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
]

export default function DateBar() {
  const router = useRouter()
  const params = useSearchParams()
  const currentDate = params.get("date") || format(new Date(), "yyyy-MM-dd")
  const currentDays = params.get("days") || "0"

  function navigate(date: string, days: string) {
    const p = new URLSearchParams()
    p.set("date", date)
    p.set("days", days)
    router.push(`/?${p.toString()}`)
  }

  const todayStr = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
      {PRESETS.map(({ label, days }) => {
        const targetDate = days === 0 ? todayStr : format(subDays(new Date(), 0), "yyyy-MM-dd")
        const isActive = days === 0
          ? currentDays === "0" && currentDate === todayStr
          : currentDays === String(days)

        return (
          <button
            key={label}
            onClick={() => navigate(targetDate, String(days))}
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

      <input
        type="date"
        value={currentDate}
        max={todayStr}
        onChange={(e) => navigate(e.target.value, "0")}
        className="ml-auto px-2 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
      />
    </div>
  )
}
