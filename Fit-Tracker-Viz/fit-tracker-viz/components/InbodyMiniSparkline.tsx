"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"

interface Props {
  values: (number | null)[]
  color: string
}

export default function InbodyMiniSparkline({ values, color }: Props) {
  const points = values.map((v, i) => ({
    i,
    v: v != null && !Number.isNaN(v) ? Number(v) : null,
  }))
  const hasData = points.some((p) => p.v != null)
  if (!hasData) {
    return <div className="h-7 w-[4.5rem] rounded bg-gray-800/80" aria-hidden />
  }

  return (
    <div className="h-7 w-[4.5rem]" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
