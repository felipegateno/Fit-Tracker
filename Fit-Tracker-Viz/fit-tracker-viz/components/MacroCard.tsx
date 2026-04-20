"use client"

import { useState } from "react"
import { MACRO_COLORS } from "@/types"
import { formatNum } from "@/lib/utils"
import type { DailyTotals, DailyGoals } from "@/types"

interface Props {
  totals: DailyTotals
  totalFiber: number
  goals: DailyGoals | null
}

interface MacroRow {
  key: string
  label: string
  value: number
  goal: number
  color: string
  unit: string
}

/** Native SVG donut chart */
function DonutChart({
  data,
  size = 88,
}: {
  data: { v: number; color: string }[]
  size?: number
}) {
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.43,
    ir = size * 0.3
  const total = data.reduce((s, d) => s + d.v, 0) || 1
  let angle = -Math.PI / 2
  const slices = data.map((d) => {
    const a = (d.v / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle),
      y1 = cy + r * Math.sin(angle)
    angle += a
    const x2 = cx + r * Math.cos(angle),
      y2 = cy + r * Math.sin(angle)
    const ix1 = cx + ir * Math.cos(angle - a),
      iy1 = cy + ir * Math.sin(angle - a)
    const ix2 = cx + ir * Math.cos(angle),
      iy2 = cy + ir * Math.sin(angle)
    const lg = a > Math.PI ? 1 : 0
    return {
      ...d,
      path: `M${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${ix2} ${iy2} A${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1} Z`,
    }
  })
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="none" />
      ))}
    </svg>
  )
}

/** Macro progress bar */
function MBar({
  label,
  v,
  g,
  color,
}: {
  label: string
  v: number
  g: number
  color: string
}) {
  const pct = Math.min((v / (g || 1)) * 100, 110)
  const over = v > g
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        className="flex justify-between"
        style={{ fontSize: 12, marginBottom: 3 }}
      >
        <span style={{ color: "var(--ft-sub2)" }}>{label}</span>
        <span style={{ color: "var(--ft-text)" }}>
          <b>{Math.round(v)}</b>
          <span style={{ color: "var(--ft-sub)" }}> / {g}g</span>
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: over ? "var(--ft-amber)" : color,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  )
}

export default function MacroCard({ totals, totalFiber: _totalFiber, goals }: Props) {
  const [_activeDonut, _setActiveDonut] = useState<number | null>(null)

  const macros: MacroRow[] = [
    {
      key: "proteina",
      label: "Proteína",
      value: totals.total_protein,
      goal: goals?.protein_goal_g ?? 130,
      color: MACRO_COLORS.proteina,
      unit: "g",
    },
    {
      key: "carbos",
      label: "Carbohidratos",
      value: totals.total_carbs,
      goal: goals?.carbs_goal_g ?? 200,
      color: MACRO_COLORS.carbohidratos,
      unit: "g",
    },
    {
      key: "grasas",
      label: "Grasas",
      value: totals.total_fat,
      goal: goals?.fat_goal_g ?? 65,
      color: MACRO_COLORS.grasas,
      unit: "g",
    },
  ]

  const totalCal = totals.total_calories || 1
  const protCal = totals.total_protein * 4
  const carbsCal = totals.total_carbs * 4
  const fatCal = totals.total_fat * 9

  const donutData = [
    { v: protCal, color: MACRO_COLORS.proteina },
    { v: carbsCal, color: MACRO_COLORS.carbohidratos },
    { v: fatCal, color: MACRO_COLORS.grasas },
  ]

  const legendItems = [
    { color: MACRO_COLORS.proteina, label: "Prot", cal: protCal },
    { color: MACRO_COLORS.carbohidratos, label: "Carbs", cal: carbsCal },
    { color: MACRO_COLORS.grasas, label: "Grasa", cal: fatCal },
  ]

  return (
    <section className="px-3.5 space-y-2">
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ft-sub)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Macros del día
      </h2>

      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        {/* Donut + bars side by side */}
        <div className="flex gap-3.5 items-center mb-3">
          <DonutChart data={donutData} size={88} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {macros.map((m) => (
              <MBar
                key={m.key}
                label={m.label}
                v={m.value}
                g={m.goal}
                color={m.color}
              />
            ))}
          </div>
        </div>

        {/* Legend row */}
        <div
          className="flex gap-3 justify-center flex-wrap pt-2"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {legendItems.map(({ color, label, cal }) => (
            <div
              key={label}
              className="flex items-center gap-1.5"
              style={{ fontSize: 11 }}
            >
              <div
                style={{ width: 7, height: 7, borderRadius: 2, background: color }}
              />
              <span style={{ color: "var(--ft-sub2)" }}>{label}</span>
              <span style={{ color: "var(--ft-text)", fontWeight: 600 }}>
                {totalCal > 0 ? Math.round((cal / totalCal) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
