"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Coffee, Cookie, Moon, UtensilsCrossed } from "lucide-react"
import type { FoodLogEntry } from "@/types"
import { formatNum } from "@/lib/utils"

const SPECIFIC = new Set(["breakfast", "lunch", "dinner", "snack"])

type MealVisualKind = "breakfast" | "lunch" | "dinner" | "snack"

const MEAL_LABEL: Record<MealVisualKind, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
}

const MEAL_ICON_COLOR: Record<MealVisualKind, string> = {
  breakfast: "text-amber-400",
  lunch: "text-emerald-400",
  snack: "text-indigo-400",
  dinner: "text-blue-400",
}

interface MealGroup {
  kind: MealVisualKind
  label: string
  time: string
  items: FoodLogEntry[]
}

function inferUnspecifiedKind(d: Date): { label: string; kind: MealVisualKind } {
  const h = d.getHours()
  if (h < 11) return { label: MEAL_LABEL.breakfast, kind: "breakfast" }
  if (h < 15) return { label: MEAL_LABEL.lunch, kind: "lunch" }
  if (h < 17) return { label: MEAL_LABEL.snack, kind: "snack" }
  return { label: MEAL_LABEL.dinner, kind: "dinner" }
}

function clusterUnspecified(entries: FoodLogEntry[]): FoodLogEntry[][] {
  if (entries.length === 0) return []
  const sorted = [...entries].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  )
  const clusters: FoodLogEntry[][] = []
  let current: FoodLogEntry[] = [sorted[0]]
  const windowMs = 10 * 60 * 1000
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].logged_at).getTime()
    const cur = new Date(sorted[i].logged_at).getTime()
    if (cur - prev <= windowMs) {
      current.push(sorted[i])
    } else {
      clusters.push(current)
      current = [sorted[i]]
    }
  }
  clusters.push(current)
  return clusters
}

function buildGroups(entries: FoodLogEntry[]): MealGroup[] {
  const specified = entries.filter((e) => SPECIFIC.has(e.meal_type))
  const unspecified = entries.filter((e) => !SPECIFIC.has(e.meal_type))

  const groups: MealGroup[] = []

  for (const mt of ["breakfast", "lunch", "dinner", "snack"] as const) {
    const items = specified.filter((e) => e.meal_type === mt)
    if (items.length === 0) continue
    const sorted = [...items].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    )
    groups.push({
      kind: mt,
      label: MEAL_LABEL[mt],
      time: sorted[0].logged_at,
      items: sorted,
    })
  }

  for (const cluster of clusterUnspecified(unspecified)) {
    const sorted = [...cluster].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    )
    const first = new Date(sorted[0].logged_at)
    const { label, kind } = inferUnspecifiedKind(first)
    groups.push({
      kind,
      label,
      time: sorted[0].logged_at,
      items: sorted,
    })
  }

  return groups.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function groupTotalKcal(items: FoodLogEntry[]): number {
  return Math.round(items.reduce((s, i) => s + Number(i.calories ?? 0), 0))
}

function MealIcon({ kind, className }: { kind: MealVisualKind; className?: string }) {
  const cn = `${MEAL_ICON_COLOR[kind]} shrink-0 ${className ?? ""}`
  switch (kind) {
    case "breakfast":
      return <Coffee className={cn} size={18} strokeWidth={2} aria-hidden />
    case "lunch":
      return <UtensilsCrossed className={cn} size={18} strokeWidth={2} aria-hidden />
    case "snack":
      return <Cookie className={cn} size={18} strokeWidth={2} aria-hidden />
    case "dinner":
      return <Moon className={cn} size={18} strokeWidth={2} aria-hidden />
  }
}

function capitalizeInput(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  entries: FoodLogEntry[]
}

export default function MealLog({ entries }: Props) {
  const groups = useMemo(() => buildGroups(entries), [entries])

  return (
    <section className="px-4 space-y-3" aria-label="Registro de comidas">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Registro de comidas
      </h2>

      <div className="bg-gray-900 rounded-xl p-4 space-y-0">
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Sin registros para este día</p>
        ) : (
          groups.map((g, gi) => (
            <div
              key={`${g.time}-${g.label}-${gi}`}
              className={gi > 0 ? "border-t border-gray-800 pt-4 mt-4" : ""}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MealIcon kind={g.kind} />
                  <span className="text-sm font-medium text-white truncate">
                    {g.label}
                    <span className="text-gray-500 font-normal">
                      {" "}
                      · {format(parseISO(g.time), "HH:mm")}
                    </span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-300 shrink-0 tabular-nums">
                  {formatNum(groupTotalKcal(g.items))} kcal
                </span>
              </div>
              <ul className="space-y-1.5 pl-7">
                {g.items.map((item, ii) => (
                  <li
                    key={`${item.logged_at}-${item.raw_input}-${ii}`}
                    className="flex items-baseline justify-between gap-2 text-xs text-gray-400"
                  >
                    <span className="text-gray-300 min-w-0 truncate">
                      {capitalizeInput(item.raw_input)}
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-500">
                      {formatNum(Number(item.quantity_g))} g · {formatNum(Number(item.calories))}{" "}
                      kcal
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
