"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"
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

type DistItem = { label: string; cal: number; color: string; fullLabel: string }

export default function MacroCard({ totals, totalFiber: _totalFiber, goals }: Props) {
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

  const distribution: DistItem[] = [
    { label: "Prot", fullLabel: "Proteína", cal: protCal, color: MACRO_COLORS.proteina },
    { label: "Carbs", fullLabel: "Carbohidratos", cal: carbsCal, color: MACRO_COLORS.carbohidratos },
    { label: "Gras", fullLabel: "Grasas", cal: fatCal, color: MACRO_COLORS.grasas },
  ]

  const [activeDonut, setActiveDonut] = useState<number | null>(null)

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Macros del día</h2>
      <div className="bg-gray-900 rounded-xl p-4 space-y-4">
        {macros.map((m) => {
          const goalSafe = m.goal > 0 ? m.goal : 1
          const pctRaw = (m.value / goalSafe) * 100
          const pctDisplay = Math.round(pctRaw)
          const over = pctRaw > 100
          const barMax = Math.max(pctRaw, 100)
          const normalWidth = (Math.min(pctRaw, 100) / barMax) * 100
          const excessWidth = over ? ((pctRaw - 100) / barMax) * 100 : 0
          const markerLeft = (100 / barMax) * 100

          return (
            <div key={m.key} className="space-y-1.5">
              <div className="flex justify-between text-sm gap-2">
                <span className="text-gray-300">{m.label}</span>
                <span className="text-gray-400 text-right">
                  <span className="text-white font-medium">{formatNum(m.value)}</span>
                  {" / "}
                  {formatNum(m.goal)}
                  {m.unit}
                  <span className="text-gray-500"> — {pctDisplay}%</span>
                </span>
              </div>
              <div className="relative pt-0.5">
                <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden w-full flex">
                  <div
                    className={`h-full shrink-0 ${over ? "rounded-l-full" : "rounded-full"}`}
                    style={{
                      width: `${normalWidth}%`,
                      backgroundColor: m.color,
                    }}
                  />
                  {over && (
                    <div
                      className="h-full rounded-r-full shrink-0"
                      style={{
                        width: `${excessWidth}%`,
                        backgroundColor: "#f97316",
                      }}
                    />
                  )}
                </div>
                {over && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none opacity-90 rounded-full"
                    style={{ left: `${markerLeft}%`, transform: "translateX(-50%)" }}
                    aria-hidden
                  />
                )}
              </div>
            </div>
          )
        })}

        <div className="pt-2 space-y-3">
          <span className="text-xs text-gray-500">Distribución calórica</span>
          <div className="flex flex-col items-center gap-3">
            <PieChart width={200} height={200} className="mx-auto">
              <Pie
                data={distribution}
                dataKey="cal"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
                onClick={(_, index) => setActiveDonut(activeDonut === index ? null : index)}
              >
                {distribution.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color}
                    stroke={activeDonut === i ? "#e5e7eb" : "#111827"}
                    strokeWidth={activeDonut === i ? 3 : 1}
                    className="cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#9ca3af" }}
                formatter={(val) => [`${Math.round(Number(val ?? 0))} kcal`, ""]}
              />
            </PieChart>
            {activeDonut != null && distribution[activeDonut] && (
              <div
                className="w-full rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-center text-sm"
                role="status"
              >
                <span className="font-medium text-white">{distribution[activeDonut].fullLabel}</span>
                <span className="text-gray-400"> — </span>
                <span className="text-indigo-300">
                  {Math.round(distribution[activeDonut].cal).toLocaleString("es-CL")} kcal
                </span>
                <span className="text-gray-500 text-xs block mt-0.5">
                  {totalCal > 0
                    ? `${Math.round((distribution[activeDonut].cal / totalCal) * 100)}% del total`
                    : ""}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-600 text-center">Toca un sector para ver calorías</p>
          </div>
          <div className="flex gap-3 text-xs text-gray-500 flex-wrap justify-center">
            {distribution.map((d) => (
              <span key={d.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                {d.label} {totalCal > 0 ? Math.round((d.cal / totalCal) * 100) : 0}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
