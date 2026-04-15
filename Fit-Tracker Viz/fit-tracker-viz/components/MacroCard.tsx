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

export default function MacroCard({ totals, totalFiber, goals }: Props) {
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
    {
      key: "fibra",
      label: "Fibra",
      value: totalFiber,
      goal: 30,
      color: MACRO_COLORS.fibra,
      unit: "g",
    },
  ]

  const totalCal = totals.total_calories || 1
  const protCal = totals.total_protein * 4
  const carbsCal = totals.total_carbs * 4
  const fatCal = totals.total_fat * 9

  const distribution = [
    { label: "Prot", cal: protCal, color: MACRO_COLORS.proteina },
    { label: "Carbs", cal: carbsCal, color: MACRO_COLORS.carbohidratos },
    { label: "Gras", cal: fatCal, color: MACRO_COLORS.grasas },
  ]

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Macros del día</h2>
      <div className="bg-gray-900 rounded-xl p-4 space-y-4">
        {macros.map((m) => {
          const pct = Math.min((m.value / m.goal) * 100, 100)
          return (
            <div key={m.key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{m.label}</span>
                <span className="text-gray-400">
                  <span className="text-white font-medium">{formatNum(m.value)}</span>
                  {" / "}{formatNum(m.goal)}{m.unit}
                </span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: m.color }}
                />
              </div>
            </div>
          )
        })}

        {/* Caloric distribution donut-style bar */}
        <div className="pt-2 space-y-2">
          <span className="text-xs text-gray-500">Distribución calórica</span>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {distribution.map((d) => {
              const w = totalCal > 0 ? (d.cal / totalCal) * 100 : 0
              return (
                <div
                  key={d.label}
                  className="h-full rounded-sm"
                  style={{ width: `${w}%`, backgroundColor: d.color }}
                  title={`${d.label}: ${Math.round(w)}%`}
                />
              )
            })}
          </div>
          <div className="flex gap-3 text-xs text-gray-500">
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
