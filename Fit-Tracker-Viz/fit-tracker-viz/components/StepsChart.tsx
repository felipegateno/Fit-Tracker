"use client"

import { useState } from "react"
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

export default function StepsChart({ data }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const n = data.length
  const formatted = data.map((d) => ({
    ...d,
    goal: d.step_goal || STEP_GOAL_DEFAULT,
    label: formatDate(d.date).split(" ")[0] ?? d.date,
  }))

  const maxGoal = Math.max(...formatted.map((d) => d.goal), STEP_GOAL_DEFAULT)
  const maxVal = Math.max(...formatted.map((d) => d.total_steps), maxGoal)

  const sel = selectedIdx != null ? formatted[selectedIdx] : null

  // SVG dimensions
  const W = 320,
    H = 120,
    PL = 30,
    PB = 22,
    PT = 8,
    PR = 8
  const cw = W - PL - PR,
    ch = H - PB - PT
  const barW = Math.min(18, (cw / n) * 0.55)
  const grpW = cw / n

  function bx(i: number) {
    return PL + i * grpW + grpW / 2
  }
  function by(v: number) {
    return PT + ch * (1 - v / maxVal)
  }
  function bh(v: number) {
    return Math.max(0, ch * (v / maxVal))
  }

  const refY = by(maxGoal)

  const yLabels = [0, 0.5, 1].map((t) => Math.round(maxVal * t))

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
        Pasos diarios · {n === 7 ? "7 días" : n === 30 ? "30 días" : `${n} días`}
      </h2>

      <div
        className="rounded-2xl"
        style={{
          background: "var(--ft-card)",
          border: "1px solid var(--ft-border)",
          padding: "14px 14px 8px",
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
          {yLabels.map((v) => {
            const y = by(v)
            return (
              <g key={v}>
                <line
                  x1={PL}
                  y1={y}
                  x2={W - PR}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#64748B">
                  {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                </text>
              </g>
            )
          })}

          {/* Goal reference line */}
          <line
            x1={PL}
            y1={refY}
            x2={W - PR}
            y2={refY}
            stroke="#22C55E"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {formatted.map((d, i) => {
            const sel = selectedIdx === i
            const reachedGoal = d.total_steps >= d.goal
            return (
              <g
                key={i}
                onClick={() => setSelectedIdx(sel ? null : i)}
                style={{ cursor: "pointer" }}
              >
                {sel && (
                  <rect
                    x={PL + i * grpW}
                    y={PT}
                    width={grpW}
                    height={ch}
                    fill="rgba(255,255,255,0.04)"
                    rx="3"
                  />
                )}
                {d.total_steps > 0 && (
                  <rect
                    x={bx(i) - barW / 2}
                    y={by(d.total_steps)}
                    width={barW}
                    height={bh(d.total_steps)}
                    fill={reachedGoal ? "#22C55E" : "#4F8EF7"}
                    fillOpacity={sel ? 1 : 0.85}
                    rx="2.5"
                  />
                )}
              </g>
            )
          })}

          {formatted.map((d, i) => (
            <text
              key={i}
              x={bx(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#64748B"
            >
              {d.label}
            </text>
          ))}
        </svg>

        <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: 10, color: "var(--ft-sub)" }}>
          <div
            style={{
              width: 16,
              height: 0,
              borderTop: "1.5px dashed #22C55E",
            }}
          />
          Meta {(maxGoal / 1000).toFixed(0)}k pasos
        </div>

        {/* Day popup */}
        {sel && (
          <div
            className="mt-2.5 rounded-xl p-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(79,142,247,0.2)",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className="font-semibold"
                style={{ fontSize: 13, color: "var(--ft-text)" }}
              >
                {formatDate(sel.date)} · Pasos
              </span>
              <button
                onClick={() => setSelectedIdx(null)}
                className="rounded-md px-1.5 py-0.5"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  color: "var(--ft-sub)",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                ✕
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <div>
                <div
                  className="font-bold"
                  style={{
                    fontSize: 28,
                    color: sel.total_steps >= sel.goal ? "#22C55E" : "var(--ft-accent)",
                  }}
                >
                  {formatNum(sel.total_steps)}
                </div>
                <div style={{ fontSize: 11, color: "var(--ft-sub)" }}>
                  de {formatNum(sel.goal)} meta ·{" "}
                  {Math.round((sel.total_steps / sel.goal) * 100)}%
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 6,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (sel.total_steps / sel.goal) * 100)}%`,
                      height: "100%",
                      background:
                        sel.total_steps >= sel.goal ? "#22C55E" : "var(--ft-accent)",
                      borderRadius: 3,
                    }}
                  />
                </div>
                {sel.total_steps >= sel.goal && (
                  <div style={{ fontSize: 10, color: "#22C55E", marginTop: 4 }}>
                    ✓ Meta alcanzada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
