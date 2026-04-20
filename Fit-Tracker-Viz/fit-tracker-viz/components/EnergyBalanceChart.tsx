"use client"

import { useState, useRef, useCallback } from "react"
import { formatDate, formatNum } from "@/lib/utils"

interface DayData {
  date: string
  consumidas: number
  quemadas: number
}

interface Props {
  data: DayData[]
}

/* ── SVG bar chart (weekly mode) ── */
function SvgBarChart({
  data,
  selectedIdx,
  onBarClick,
}: {
  data: DayData[]
  selectedIdx: number | null
  onBarClick: (i: number | null) => void
}) {
  const W = 320,
    H = 140,
    PL = 30,
    PB = 22,
    PT = 8,
    PR = 8
  const cw = W - PL - PR,
    ch = H - PB - PT
  const allVals = data.flatMap((d) => [d.consumidas, d.quemadas])
  const maxV = Math.max(...allVals, 1)
  const barW = Math.min(14, (cw / data.length) * 0.32)
  const grpW = cw / data.length

  function bx(i: number, ki: number) {
    return PL + i * grpW + grpW / 2 + (ki - 0.5) * (barW + 2)
  }
  function by(v: number) {
    return PT + ch * (1 - v / maxV)
  }
  function th(v: number) {
    return Math.max(0, ch * (v / maxV))
  }

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxV * t))
  const labels = data.map((d) => {
    const parts = formatDate(d.date).split(" ")
    return parts[0] ?? d.date
  })

  return (
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
              {v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const sel = selectedIdx === i
        return (
          <g
            key={i}
            onClick={() => onBarClick(sel ? null : i)}
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
            {/* consumidas bar */}
            {d.consumidas > 0 && (
              <rect
                x={bx(i, 0) - barW / 2}
                y={by(d.consumidas)}
                width={barW}
                height={th(d.consumidas)}
                fill="#4F8EF7"
                fillOpacity={sel ? 1 : 0.85}
                rx="2.5"
              />
            )}
            {/* quemadas bar */}
            {d.quemadas > 0 && (
              <rect
                x={bx(i, 1) - barW / 2}
                y={by(d.quemadas)}
                width={barW}
                height={th(d.quemadas)}
                fill="#F59E0B"
                fillOpacity={sel ? 1 : 0.85}
                rx="2.5"
              />
            )}
          </g>
        )
      })}
      {data.map((d, i) => (
        <text
          key={i}
          x={PL + i * grpW + grpW / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#64748B"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  )
}

/* ── SVG balance area chart (monthly mode) ── */
function SvgBalanceChart({ data }: { data: DayData[] }) {
  const [hi, setHi] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 320,
    H = 150,
    PL = 32,
    PB = 22,
    PT = 10,
    PR = 8
  const ch = H - PB - PT,
    cw = W - PL - PR

  const vals = data.map((d) => d.consumidas - d.quemadas)
  const maxAbs = Math.max(...vals.map(Math.abs), 100)
  const ys = (v: number) => PT + ch * (0.5 - v / (2 * maxAbs))
  const xs = (i: number) => PL + i * (cw / (data.length - 1))
  const pts = data.map((d, i) => `${xs(i)},${ys(d.consumidas - d.quemadas)}`)
  const midY = PT + ch * 0.5

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const clientX =
        "touches" in e
          ? e.touches[0]?.clientX ?? 0
          : (e as React.MouseEvent).clientX
      const cx = ((clientX - rect.left) / rect.width) * W
      let best = 0,
        bd = Infinity
      data.forEach((_, i) => {
        const d = Math.abs(xs(i) - cx)
        if (d < bd) {
          bd = d
          best = i
        }
      })
      setHi(best)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  const hd = hi != null ? data[hi] : null
  const hval = hd ? hd.consumidas - hd.quemadas : null
  const tipX = hi != null ? xs(hi) : 0
  const tipLeft = hi != null && hi > data.length * 0.7

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", cursor: "crosshair" }}
      onMouseMove={onMove}
      onMouseLeave={() => setHi(null)}
      onTouchMove={onMove}
      onTouchEnd={() => setHi(null)}
    >
      <line
        x1={PL}
        y1={midY}
        x2={W - PR}
        y2={midY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <defs>
        <linearGradient id="posG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F87171" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="negG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* surplus (positive = consumed > burned) fill red */}
      <path
        d={`M ${xs(0)},${midY} ${data.map((d, i) => `L ${xs(i)},${Math.min(ys(d.consumidas - d.quemadas), midY)}`).join(" ")} L ${xs(data.length - 1)},${midY} Z`}
        fill="url(#posG)"
      />
      {/* deficit fill green */}
      <path
        d={`M ${xs(0)},${midY} ${data.map((d, i) => `L ${xs(i)},${Math.max(ys(d.consumidas - d.quemadas), midY)}`).join(" ")} L ${xs(data.length - 1)},${midY} Z`}
        fill="url(#negG)"
      />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke="#4F8EF7" strokeWidth="2" />
      {[-1, 0, 1].map((t) => {
        const v = Math.round(maxAbs * t),
          y = ys(v)
        return (
          <text key={t} x={PL - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#64748B">
            {t === 0 ? "0" : t > 0 ? `+${(v / 1000).toFixed(1)}k` : `${(v / 1000).toFixed(1)}k`}
          </text>
        )
      })}
      {data.map((d, i) => {
        const show = data.length <= 10 || i % Math.ceil(data.length / 8) === 0
        const day = new Date(d.date + "T12:00:00").getDate()
        return show ? (
          <text
            key={i}
            x={xs(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="8"
            fill="#64748B"
          >
            {day}
          </text>
        ) : null
      })}
      {hi != null && hval != null && hd && (
        <>
          <line
            x1={tipX}
            y1={PT}
            x2={tipX}
            y2={H - PB}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={tipX}
            cy={ys(hval)}
            r="4"
            fill={hval <= 0 ? "#22C55E" : "#F87171"}
            stroke="white"
            strokeWidth="1.5"
          />
          {(() => {
            const tw = 82,
              th2 = 38,
              tx = tipLeft ? tipX - tw - 6 : tipX + 6,
              ty = PT + 2
            return (
              <>
                <rect
                  x={tx}
                  y={ty}
                  width={tw}
                  height={th2}
                  rx="5"
                  fill="#1a2235"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
                <text
                  x={tx + tw / 2}
                  y={ty + 13}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94A3B8"
                  fontFamily="Space Grotesk,sans-serif"
                >
                  Día {new Date(hd.date + "T12:00:00").getDate()}
                </text>
                <text
                  x={tx + tw / 2}
                  y={ty + 26}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={hval <= 0 ? "#22C55E" : "#F87171"}
                  fontFamily="Space Grotesk,sans-serif"
                >
                  {hval > 0 ? "+" : ""}
                  {formatNum(hval)} kcal
                </text>
              </>
            )
          })()}
        </>
      )}
    </svg>
  )
}

export default function EnergyBalanceChart({ data }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const n = data.length
  const isMonthly = n > 10

  const sel = selectedIdx != null ? data[selectedIdx] : null

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
        {isMonthly ? "Balance mensual · Consumidas − Quemadas" : `Calorías · ${n} días`}
      </h2>

      <div
        className="rounded-2xl"
        style={{
          background: "var(--ft-card)",
          border: "1px solid var(--ft-border)",
          padding: "14px 14px 8px",
        }}
      >
        {isMonthly ? (
          <>
            <div
              style={{ fontSize: 11, color: "var(--ft-sub)", marginBottom: 8 }}
            >
              Consumidas − Quemadas
            </div>
            <SvgBalanceChart data={data} />
            <div className="flex gap-3.5 justify-center mt-1">
              {[
                ["#22C55E", "Déficit"],
                ["#F87171", "Superávit"],
              ].map(([c, l]) => (
                <div
                  key={l}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 11, color: "var(--ft-sub2)" }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      background: c,
                      opacity: 0.7,
                    }}
                  />
                  {l}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <SvgBarChart
              data={data}
              selectedIdx={selectedIdx}
              onBarClick={setSelectedIdx}
            />
            <div className="flex gap-3.5 justify-center mt-1">
              {[
                ["#4F8EF7", "Consumidas"],
                ["#F59E0B", "Quemadas"],
              ].map(([c, l]) => (
                <div
                  key={l}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 11, color: "var(--ft-sub2)" }}
                >
                  <div
                    style={{ width: 9, height: 9, borderRadius: 2, background: c }}
                  />
                  {l}
                </div>
              ))}
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
                    {formatDate(sel.date)}
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
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["Consumidas", sel.consumidas, "#4F8EF7"],
                      ["Quemadas", sel.quemadas, "#F59E0B"],
                      [
                        "Balance",
                        sel.consumidas - sel.quemadas,
                        sel.consumidas - sel.quemadas <= 0 ? "#22C55E" : "#F87171",
                      ],
                    ] as [string, number, string][]
                  ).map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: "var(--ft-sub)",
                          marginBottom: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        className="font-bold"
                        style={{ fontSize: 15, color }}
                      >
                        {label === "Balance" && val > 0 ? "+" : ""}
                        {formatNum(val)}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--ft-sub)" }}>kcal</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
