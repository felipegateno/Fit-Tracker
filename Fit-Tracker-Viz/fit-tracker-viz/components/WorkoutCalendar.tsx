"use client"

import { useEffect, useState, useMemo } from "react"
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
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { GarminActivity, ActivityCategory } from "@/types"
import { ACTIVITY_COLOR_MAP, GARMIN_TYPE_TO_CATEGORY, CATEGORY_LABEL } from "@/types"
import { secondsToHoursLabel } from "@/lib/utils"

interface Props {
  activities: GarminActivity[]
  month: string
  weekMode?: boolean
  weekRange?: { start: string; end: string }
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

function activityDetailLine(act: GarminActivity): string {
  const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
  if (
    cat === "bicicleta" ||
    cat === "trekking" ||
    cat === "running" ||
    cat === "caminata"
  ) {
    const km = (act.distance_meters ?? 0) / 1000
    if (km <= 0) return "Sin distancia"
    return `${km.toFixed(1).replace(".", ",")} km`
  }
  if (cat === "gimnasio") {
    return secondsToHoursLabel(act.duration_seconds ?? 0)
  }
  return secondsToHoursLabel(act.duration_seconds ?? 0)
}

export default function WorkoutCalendar({
  activities: initialActivities,
  month,
  weekMode = false,
  weekRange,
}: Props) {
  const [viewMonth, setViewMonth] = useState(month)
  const [activities, setActivities] = useState<GarminActivity[]>(initialActivities)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    if (!weekMode) setViewMonth(month)
  }, [month, weekMode])

  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  useEffect(() => {
    if (weekMode) return
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
  }, [viewMonth, month, initialActivities, weekMode])

  const weekDays = useMemo(() => {
    if (!weekMode || !weekRange) return []
    const a = parseISO(weekRange.start + "T12:00:00")
    const b = parseISO(weekRange.end + "T12:00:00")
    return eachDayOfInterval({ start: a, end: b })
  }, [weekMode, weekRange])

  const monthStart = startOfMonth(parseISO(viewMonth + "-01"))
  const monthEnd = endOfMonth(monthStart)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const days = weekMode ? weekDays : monthDays

  const byDate: Record<string, ActivityCategory[]> = {}
  for (const act of activities) {
    const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
    if (!byDate[act.date]) byDate[act.date] = []
    if (!byDate[act.date].includes(cat)) byDate[act.date].push(cat)
  }

  const firstDow = weekMode ? 0 : (getDay(monthStart) + 6) % 7

  const today = format(new Date(), "yyyy-MM-dd")

  const usedCategories = [...new Set(Object.values(byDate).flat())] as ActivityCategory[]

  const dayActs = selectedDay
    ? activities.filter((a) => a.date === selectedDay)
    : []

  return (
    <section className="px-4 space-y-3 relative">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex-1 min-w-0">
          {weekMode
            ? "Entrenamientos — semana"
            : `Entrenamientos — ${format(monthStart, "MMMM yyyy", { locale: es })}`}
        </h2>
        {!weekMode && (
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
        )}
      </div>
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div
          className={`grid gap-1 ${weekMode ? "grid-cols-7" : "grid-cols-7"}`}
        >
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium">
              {d}
            </div>
          ))}
        </div>

        <div
          className={`grid gap-1 ${weekMode ? "grid-cols-7" : "grid-cols-7"}`}
        >
          {!weekMode &&
            Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd")
            const cats = byDate[iso] ?? []
            const isToday = iso === today
            const hasActivity = cats.length > 0
            const primaryColor = hasActivity ? ACTIVITY_COLOR_MAP[cats[0]] : null

            return (
              <button
                type="button"
                key={iso}
                onClick={() => hasActivity && setSelectedDay(iso)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${
                  isToday ? "ring-2 ring-indigo-500" : ""
                } ${hasActivity ? "cursor-pointer" : "cursor-default"}`}
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
              </button>
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

      {selectedDay && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-sm font-medium text-white">
                {format(parseISO(selectedDay + "T12:00:00"), "EEEE d MMM", { locale: es })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-800"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="divide-y divide-gray-800 px-3 py-2">
              {dayActs.map((act) => {
                const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
                const col = ACTIVITY_COLOR_MAP[cat]
                return (
                  <li key={act.id} className="py-2.5 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: col }}
                      />
                      <span className="text-sm text-white font-medium">{act.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{CATEGORY_LABEL[cat]}</span>
                    <span className="text-sm text-indigo-300">{activityDetailLine(act)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
