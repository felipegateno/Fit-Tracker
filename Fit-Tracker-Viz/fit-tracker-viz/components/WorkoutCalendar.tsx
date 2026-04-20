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

  const navBtnStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "none",
    borderRadius: 8,
    width: 28,
    height: 28,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    color: "var(--ft-sub2)",
  }

  return (
    <section className="px-3.5 space-y-2 relative">
      <div className="flex items-center justify-between gap-2">
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ft-sub)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            flex: 1,
          }}
        >
          {weekMode
            ? "Entrenamientos — semana"
            : `Entrenamientos — ${format(monthStart, "MMMM yyyy", { locale: es })}`}
        </h2>
        {!weekMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              style={navBtnStyle}
              onClick={() => setViewMonth(format(subMonths(monthStart, 1), "yyyy-MM"))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              style={navBtnStyle}
              onClick={() => setViewMonth(format(addMonths(monthStart, 1), "yyyy-MM"))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-3 space-y-2.5"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center font-medium"
              style={{ fontSize: 9, color: "var(--ft-sub)", paddingBottom: 4 }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
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
                className="aspect-square flex flex-col items-center justify-center rounded-md relative"
                style={{
                  background: primaryColor ? `${primaryColor}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${primaryColor ? `${primaryColor}44` : "var(--ft-border)"}`,
                  cursor: hasActivity ? "pointer" : "default",
                  outline: isToday ? "2px solid var(--ft-accent)" : "none",
                  outlineOffset: 1,
                }}
                title={cats.map((c) => CATEGORY_LABEL[c]).join(", ")}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: hasActivity ? 600 : 400,
                    color: hasActivity ? primaryColor ?? "var(--ft-text)" : "var(--ft-sub)",
                    lineHeight: 1,
                  }}
                >
                  {format(day, "d")}
                </span>
                {cats.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {cats.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="rounded-full"
                        style={{
                          width: 3.5,
                          height: 3.5,
                          backgroundColor: ACTIVITY_COLOR_MAP[c],
                          display: "block",
                        }}
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
              <span
                key={cat}
                className="flex items-center gap-1.5"
                style={{ fontSize: 10, color: "var(--ft-sub2)" }}
              >
                <span
                  className="rounded-full inline-block"
                  style={{ width: 6, height: 6, backgroundColor: ACTIVITY_COLOR_MAP[cat] }}
                />
                {CATEGORY_LABEL[cat]}
              </span>
            ))}
          </div>
        )}
      </div>

      {selectedDay && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-xl max-h-[70vh] overflow-y-auto"
            style={{
              background: "var(--ft-card)",
              border: "1px solid var(--ft-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--ft-border)" }}
            >
              <span
                className="font-semibold capitalize"
                style={{ fontSize: 14, color: "var(--ft-text)" }}
              >
                {format(parseISO(selectedDay + "T12:00:00"), "EEEE d MMM", { locale: es })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ft-sub)",
                }}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="px-4 py-2">
              {dayActs.map((act, idx) => {
                const cat = GARMIN_TYPE_TO_CATEGORY[act.activity_type] ?? "gimnasio"
                const col = ACTIVITY_COLOR_MAP[cat]
                return (
                  <li
                    key={act.id}
                    className="py-2.5 flex flex-col gap-0.5"
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--ft-border)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full shrink-0"
                        style={{ width: 8, height: 8, backgroundColor: col, display: "block" }}
                      />
                      <span
                        className="font-semibold"
                        style={{ fontSize: 14, color: "var(--ft-text)" }}
                      >
                        {act.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ft-sub)" }}>
                      {CATEGORY_LABEL[cat]}
                    </span>
                    <span style={{ fontSize: 13, color: col }}>
                      {activityDetailLine(act)}
                    </span>
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
