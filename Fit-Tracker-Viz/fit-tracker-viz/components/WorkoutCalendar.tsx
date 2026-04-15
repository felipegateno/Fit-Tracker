"use client"

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"
import { es } from "date-fns/locale"
import type { GarminActivity, ActivityCategory } from "@/types"
import { ACTIVITY_COLOR_MAP, GARMIN_TYPE_TO_CATEGORY, CATEGORY_LABEL } from "@/types"

interface Props {
  activities: GarminActivity[]
  month: string // "YYYY-MM"
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

export default function WorkoutCalendar({ activities, month }: Props) {
  const monthStart = startOfMonth(new Date(month + "-01"))
  const monthEnd = endOfMonth(monthStart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Map date → categories
  const byDate: Record<string, ActivityCategory[]> = {}
  for (const act of activities) {
    const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
    if (!byDate[act.date]) byDate[act.date] = []
    if (!byDate[act.date].includes(cat)) byDate[act.date].push(cat)
  }

  // Start offset (Monday = 0)
  const firstDow = (getDay(monthStart) + 6) % 7 // convert Sun=0 to Mon=0

  const today = format(new Date(), "yyyy-MM-dd")

  const usedCategories = [...new Set(Object.values(byDate).flat())] as ActivityCategory[]

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Entrenamientos — {format(monthStart, "MMMM yyyy", { locale: es })}
      </h2>
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium">{d}</div>
          ))}
        </div>

        {/* Day grid */}
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
                style={primaryColor ? { backgroundColor: primaryColor + "66" } : { backgroundColor: "#1f2937" }}
                title={cats.map((c) => CATEGORY_LABEL[c]).join(", ")}
              >
                <span className={`font-medium ${hasActivity ? "text-white" : "text-gray-600"}`}>
                  {format(day, "d")}
                </span>
                {cats.length > 1 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {cats.slice(0, 3).map((c) => (
                      <span key={c} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLOR_MAP[c] }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {usedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {usedCategories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: ACTIVITY_COLOR_MAP[cat] }} />
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
