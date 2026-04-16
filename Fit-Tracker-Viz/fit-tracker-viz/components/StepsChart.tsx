"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import { formatDate, formatNum } from "@/lib/utils"

interface DayData {
  date: string
  total_steps: number
  step_goal: number
}

interface Props {
  data: DayData[]
}

const STEP_GOAL_DEFAULT = 10000
const BAR_MIN_PX = 40
const SCROLL_THRESHOLD = 10

export default function StepsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
    goal: d.step_goal || STEP_GOAL_DEFAULT,
  }))

  const maxGoal = Math.max(...formatted.map((d) => d.goal), STEP_GOAL_DEFAULT)
  const n = formatted.length
  const needsScroll = n > SCROLL_THRESHOLD
  const innerMinWidth = needsScroll ? Math.max(n * BAR_MIN_PX, 320) : undefined

  const titleSuffix =
    n === 1 ? "1 día" : n === 7 ? "7 días" : n === 30 ? "30 días" : `${n} días`

  const chart = (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={45}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#e5e7eb" }}
          itemStyle={{ color: "#9ca3af" }}
          formatter={(val) => [`${formatNum(Number(val))} pasos`]}
        />
        <ReferenceLine
          y={maxGoal}
          stroke="#6b7280"
          strokeDasharray="4 2"
          label={{
            value: `Meta ${(maxGoal / 1000).toFixed(0)}k`,
            fill: "#6b7280",
            fontSize: 11,
            position: "insideTopRight",
          }}
        />
        <Bar dataKey="total_steps" name="Pasos" radius={[4, 4, 0, 0]}>
          {formatted.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.total_steps >= entry.goal ? "#1D9E75" : "#5DCAA5"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Pasos diarios — {titleSuffix}
      </h2>
      <div className="bg-gray-900 rounded-xl p-4">
        {needsScroll ? (
          <div className="overflow-x-auto -mx-1 px-1">
            <div style={{ minWidth: innerMinWidth }}>{chart}</div>
          </div>
        ) : (
          chart
        )}
      </div>
    </section>
  )
}
