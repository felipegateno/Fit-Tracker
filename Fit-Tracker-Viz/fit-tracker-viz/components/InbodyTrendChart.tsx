"use client"

import { useMemo, useState } from "react"
import { formatShortDate } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

const MUSCLE_COLOR = "#22C55E"
const FAT_COLOR = "#F59E0B"

type UnitMode = "kg" | "pct"

interface Props {
  chronological: InbodyMeasurement[]
}

export default function InbodyTrendChart({ chronological }: Props) {
  const [unit, setUnit] = useState<UnitMode>("kg")
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const data = useMemo(
    () =>
      chronological.map((r) => {
        const muscle_kg = r.masa_muscular != null ? Number(r.masa_muscular) : null
        const fat_kg = r.masa_grasa != null ? Number(r.masa_grasa) : null
        const peso = r.peso != null ? Number(r.peso) : null
        const fat_pct = r.porcentaje_grasa != null ? Number(r.porcentaje_grasa) : null
        const muscle_pct =
          muscle_kg != null && peso != null && peso > 0
            ? (muscle_kg / peso) * 100
            : null
        return {
          fecha: r.fecha,
          muscle: unit === "kg" ? muscle_kg : muscle_pct,
          fat: unit === "kg" ? fat_kg : fat_pct,
        }
      }),
    [chronological, unit]
  )

  if (chronological.length < 2) return null

  const W = 300
  const H = 150
  const PAD = { l: 30, r: 10, t: 10, b: 26 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b
  const n = data.length

  const allVals = data.flatMap((d) => [d.muscle, d.fat]).filter((v): v is number => v != null)
  if (allVals.length === 0) return null

  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const vRange = maxV - minV || 1
  const vPad = vRange * 0.12

  const toX = (i: number) => PAD.l + (n > 1 ? (i / (n - 1)) * cW : cW / 2)
  const toY = (v: number) =>
    PAD.t + cH - ((v - (minV - vPad)) / (vRange + 2 * vPad)) * cH

  function buildLinePath(vals: (number | null)[]): string {
    const segments: string[] = []
    let cur = ""
    vals.forEach((v, i) => {
      if (v == null) {
        if (cur) segments.push(cur)
        cur = ""
      } else {
        cur +=
          (cur ? " L " : "M ") +
          `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`
      }
    })
    if (cur) segments.push(cur)
    return segments.join(" ")
  }

  function buildAreaPath(vals: (number | null)[]): string {
    const pts = vals
      .map((v, i) => (v != null ? { x: toX(i), y: toY(v) } : null))
      .filter(Boolean) as { x: number; y: number }[]
    if (pts.length < 2) return ""
    const base = PAD.t + cH
    return (
      `M ${pts[0].x.toFixed(1)},${base} ` +
      pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${base} Z`
    )
  }

  const muscleLine = buildLinePath(data.map((d) => d.muscle))
  const fatLine = buildLinePath(data.map((d) => d.fat))
  const muscleArea = buildAreaPath(data.map((d) => d.muscle))
  const fatArea = buildAreaPath(data.map((d) => d.fat))

  const labelIdxs =
    n <= 3 ? data.map((_, i) => i) : [0, Math.round((n - 1) / 2), n - 1]

  const gridValues = [maxV + vPad, (minV + maxV) / 2, minV - vPad]

  return (
    <section className="px-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ft-sub)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Tendencia histórica
        </h2>
        <div
          className="flex p-0.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          {(["kg", "pct"] as UnitMode[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUnit(u)
                setHoverIdx(null)
              }}
              className="rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all"
              style={{
                background: unit === u ? "var(--ft-accent)" : "transparent",
                color: unit === u ? "#fff" : "var(--ft-sub)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {u === "pct" ? "%" : "kg"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-3"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Grid lines */}
          {gridValues.map((v, ti) => {
            const yg = PAD.t + (ti / 2) * cH
            return (
              <g key={ti}>
                <line
                  x1={PAD.l}
                  y1={yg}
                  x2={W - PAD.r}
                  y2={yg}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.l - 3}
                  y={yg + 3.5}
                  textAnchor="end"
                  fontSize="7"
                  fill="#64748B"
                  fontFamily="Space Grotesk,sans-serif"
                >
                  {v.toFixed(unit === "kg" ? 1 : 0)}
                </text>
              </g>
            )
          })}

          {/* Area fills */}
          {muscleArea && (
            <path d={muscleArea} fill={MUSCLE_COLOR} fillOpacity="0.1" />
          )}
          {fatArea && <path d={fatArea} fill={FAT_COLOR} fillOpacity="0.1" />}

          {/* Lines */}
          {muscleLine && (
            <path
              d={muscleLine}
              fill="none"
              stroke={MUSCLE_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {fatLine && (
            <path
              d={fatLine}
              fill="none"
              stroke={FAT_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots + invisible hit areas */}
          {data.map((d, i) => (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} style={{ cursor: "crosshair" }}>
              {d.muscle != null && (
                <circle
                  cx={toX(i)}
                  cy={toY(d.muscle)}
                  r={hoverIdx === i ? 4 : 2.5}
                  fill={MUSCLE_COLOR}
                />
              )}
              {d.fat != null && (
                <circle
                  cx={toX(i)}
                  cy={toY(d.fat)}
                  r={hoverIdx === i ? 4 : 2.5}
                  fill={FAT_COLOR}
                />
              )}
              <rect
                x={toX(i) - 10}
                y={PAD.t}
                width={20}
                height={cH}
                fill="transparent"
              />
            </g>
          ))}

          {/* Hover tooltip */}
          {hoverIdx != null &&
            (() => {
              const d = data[hoverIdx]
              const hx = toX(hoverIdx)
              const tipX =
                hoverIdx > n * 0.65
                  ? Math.max(PAD.l, hx - 68)
                  : hx + 4
              return (
                <>
                  <line
                    x1={hx}
                    y1={PAD.t}
                    x2={hx}
                    y2={PAD.t + cH}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                  <rect
                    x={tipX}
                    y={PAD.t + 2}
                    width={64}
                    height={40}
                    rx="5"
                    fill="#141926"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={tipX + 32}
                    y={PAD.t + 11}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#64748B"
                    fontFamily="Space Grotesk,sans-serif"
                  >
                    {formatShortDate(d.fecha)}
                  </text>
                  {d.muscle != null && (
                    <text
                      x={tipX + 32}
                      y={PAD.t + 23}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill={MUSCLE_COLOR}
                      fontFamily="Space Grotesk,sans-serif"
                      fontWeight="600"
                    >
                      M: {d.muscle.toFixed(1)}
                      {unit === "kg" ? " kg" : "%"}
                    </text>
                  )}
                  {d.fat != null && (
                    <text
                      x={tipX + 32}
                      y={PAD.t + 35}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill={FAT_COLOR}
                      fontFamily="Space Grotesk,sans-serif"
                      fontWeight="600"
                    >
                      G: {d.fat.toFixed(1)}
                      {unit === "kg" ? " kg" : "%"}
                    </text>
                  )}
                </>
              )
            })()}

          {/* X axis labels */}
          {labelIdxs.map((i) => (
            <text
              key={i}
              x={toX(i)}
              y={H - 4}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize="7"
              fill="#64748B"
              fontFamily="Space Grotesk,sans-serif"
            >
              {formatShortDate(data[i].fecha)}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex gap-4 mt-1" style={{ fontSize: 10, color: "var(--ft-sub2)" }}>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 2,
                borderRadius: 1,
                backgroundColor: MUSCLE_COLOR,
                verticalAlign: "middle",
              }}
            />
            Músculo {unit === "kg" ? "kg" : "%"}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 2,
                borderRadius: 1,
                backgroundColor: FAT_COLOR,
                verticalAlign: "middle",
              }}
            />
            Grasa {unit === "kg" ? "kg" : "%"}
          </span>
        </div>
      </div>
    </section>
  )
}
