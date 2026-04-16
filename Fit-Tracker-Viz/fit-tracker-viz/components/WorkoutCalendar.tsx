"use client"

import { useEffect, useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { GarminActivity, ActivityCategory } from "@/types"
import { ACTIVITY_COLOR_MAP, GARMIN_TYPE_TO_CATEGORY, CATEGORY_LABEL } from "@/types"

interface Props {
  activities: GarminActivity[]
  month: string // "YYYY-MM"
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

export default function WorkoutCalendar({ activities: initialActivities, month }: Props) {
  const [viewMonth, setViewMonth] = useState(month)
  const [activities, setActivities] = useState<GarminActivity[]>(initialActivities)

  useEffect(() => {
    setViewMonth(month)
  }, [month])

  useEffect(() => {
    if (viewMonth === month) {
      setActivities(initialActivities)
      return
    }
    let cancelled = false
    const anchor = `${viewMonth}-15`
    fetch(`/api/activity?type=calendar&date=${anchor}`)
      .then((res) => res.json())
      .then((data: GarminActivity[] | { error?: string }) => {
        if (cancelled || !Array.isArray(data)) return
        setActivities(data)
      })
      .catch(() => {
        if (!cancelled) setActivities([])
      })
    return () => {
      cancelled = true
    }
  }, [viewMonth, month, initialActivities])

  const monthStart = startOfMonth(parseISO(viewMonth + "-01"))
  const monthEnd = endOfMonth(monthStart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const byDate: Record<string, ActivityCategory[]> = {}
  for (const act of activities) {
    const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
    if (!byDate[act.date]) byDate[act.date] = []
    if (!byDate[act.date].includes(cat)) byDate[act.date].push(cat)
  }

  const firstDow = (getDay(monthStart) + 6) % 7

  const today = format(new Date(), "yyyy-MM-dd")

  const usedCategories = [...new Set(Object.values(byDate).flat())] as ActivityCategory[]

  return (
    <section className="px-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex-1 min-w-0">
          Entrenamientos — {format(monthStart, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMonth(format(subMonths(monthStart, 1), "yyyy-MM"))}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(format(addMonths(monthStart, 1), "yyyy-MM"))}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd")
            const cats = byDate[iso] ?? []
            const isToday = iso === today
            const hasActivity = cats.length > 0
            const primaryColor = hasActivity ? ACTIVITY_COLOR_MAP[cats[0]] : null

            return (
              <div
                key={iso}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${
                  isToday ? "ring-2 ring-indigo-500" : ""
                }`}
                style={
                  primaryColor
                    ? { backgroundColor: primaryColor + "66" }
                    : { backgroundColor: "#1f2937" }
                }
                title={cats.map((c) => CATEGORY_LABEL[c]).join(", ")}
              >
                <span className={`font-medium ${hasActivity ? "text-white" : "text-gray-600"}`}>
                  {format(day, "d")}
                </span>
                {cats.length > 1 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {cats.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: ACTIVITY_COLOR_MAP[c] }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {usedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {usedCategories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: ACTIVITY_COLOR_MAP[cat] }}
                />
                {CATEGORY_LABEL[cat]}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-gray-800" />
              Descanso
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
