"use client"

import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
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

const MEAL_COLOR: Record<MealVisualKind, string> = {
  breakfast: "var(--ft-amber)",
  lunch: "var(--ft-green)",
  snack: "var(--ft-purple)",
  dinner: "var(--ft-accent)",
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
    groups.push({ kind: mt, label: MEAL_LABEL[mt], time: sorted[0].logged_at, items: sorted })
  }

  for (const cluster of clusterUnspecified(unspecified)) {
    const sorted = [...cluster].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    )
    const first = new Date(sorted[0].logged_at)
    const { label, kind } = inferUnspecifiedKind(first)
    groups.push({ kind, label, time: sorted[0].logged_at, items: sorted })
  }

  return groups.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function groupTotalKcal(items: FoodLogEntry[]): number {
  return Math.round(items.reduce((s, i) => s + Number(i.calories ?? 0), 0))
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
  const [openMeal, setOpenMeal] = useState<number | null>(null)

  return (
    <section className="px-3.5 space-y-2" aria-label="Registro de comidas">
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ft-sub)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Registro de comidas
      </h2>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        {groups.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--ft-sub)" }}>
            Sin registros para este día
          </p>
        ) : (
          groups.map((g, gi) => {
            const isOpen = openMeal === gi
            const color = MEAL_COLOR[g.kind]
            const kcal = groupTotalKcal(g.items)

            return (
              <div key={`${g.time}-${g.label}-${gi}`}>
                {gi > 0 && (
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                )}

                {/* Meal header — clickable */}
                <button
                  onClick={() => setOpenMeal(isOpen ? null : gi)}
                  className="w-full flex items-center gap-3 px-4 py-3"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <div
                    className="flex-shrink-0 rounded-sm"
                    style={{ width: 10, height: 10, background: color }}
                  />
                  <div className="flex-1 text-left">
                    <span
                      className="font-semibold"
                      style={{ fontSize: 14, color: "var(--ft-text)" }}
                    >
                      {g.label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ft-sub)" }}>
                      {" · "}
                      {format(parseISO(g.time), "HH:mm")}
                    </span>
                  </div>
                  <span
                    className="font-semibold flex-shrink-0"
                    style={{ fontSize: 13, color: "var(--ft-sub2)" }}
                  >
                    {kcal} kcal
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{
                      color: "var(--ft-sub)",
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <path
                      d="M5 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* Items — expanded */}
                {isOpen && (
                  <div style={{ paddingLeft: 38, paddingRight: 16, paddingBottom: 12 }}>
                    {g.items.map((item, ii) => (
                      <div
                        key={`${item.logged_at}-${item.raw_input}-${ii}`}
                        className="flex items-baseline justify-between gap-2 py-0.5"
                        style={{
                          fontSize: 12,
                          paddingLeft: 10,
                          borderLeft: `2px solid ${color}44`,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--ft-sub2)",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {capitalizeInput(item.raw_input)}{" "}
                          <span style={{ color: "var(--ft-sub)" }}>
                            {formatNum(Number(item.quantity_g))}g
                          </span>
                        </span>
                        <span
                          className="flex-shrink-0 font-semibold"
                          style={{ color: "var(--ft-sub2)", marginLeft: 8 }}
                        >
                          {formatNum(Number(item.calories))} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
