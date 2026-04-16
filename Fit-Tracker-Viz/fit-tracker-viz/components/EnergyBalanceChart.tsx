"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { formatDate } from "@/lib/utils"

interface DayData {
  date: string
  consumidas: number
  quemadas: number
}

interface Props {
  data: DayData[]
}

const BAR_MIN_PX = 40
const SCROLL_THRESHOLD = 10

export default function EnergyBalanceChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }))

  const n = formatted.length
  const needsScroll = n > SCROLL_THRESHOLD
  const innerMinWidth = needsScroll ? Math.max(n * BAR_MIN_PX, 320) : undefined

  const titleSuffix =
    n === 1 ? "1 día" : n === 7 ? "7 días" : n === 30 ? "30 días" : `${n} días`

  const chart = (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} barCategoryGap="30%" barGap={2}>
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
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#e5e7eb" }}
          itemStyle={{ color: "#9ca3af" }}
          formatter={(val) => [`${Math.round(Number(val))} kcal`]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
        <Bar dataKey="consumidas" name="Consumidas" fill="#5DCAA5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="quemadas" name="Quemadas" fill="#D85A30" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Balance energético — {titleSuffix}
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
