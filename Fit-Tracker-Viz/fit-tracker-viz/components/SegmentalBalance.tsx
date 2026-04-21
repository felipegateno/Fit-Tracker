"use client"

import { useCallback, useMemo, useState } from "react"
import InbodyMiniSparkline from "@/components/InbodyMiniSparkline"
import {
  formatDecimal,
  formatSignedDelta,
  inbodyDeltaColor,
  inbodyDeltaTone,
} from "@/lib/utils"
import type { InbodyMeasurement, InbodySegmentRegion } from "@/types"

type MetricMode = "muscle" | "fat"

const MUSCLE_COLOR = "var(--ft-green)"
const FAT_COLOR = "var(--ft-amber)"
const MUSCLE_HEX = "#22C55E"
const FAT_HEX = "#F59E0B"
const ASYMMETRY_THRESHOLD = 5

const REGION_META: Record<
  InbodySegmentRegion,
  {
    label: string
    short: string
    muscleField: keyof InbodyMeasurement
    fatField: keyof InbodyMeasurement
    pair: InbodySegmentRegion | null
  }
> = {
  arm_left: {
    label: "Brazo izquierdo",
    short: "Brazo Izq.",
    muscleField: "musculo_brazo_izq",
    fatField: "grasa_brazo_izq",
    pair: "arm_right",
  },
  arm_right: {
    label: "Brazo derecho",
    short: "Brazo Der.",
    muscleField: "musculo_brazo_der",
    fatField: "grasa_brazo_der",
    pair: "arm_left",
  },
  torso: {
    label: "Tronco",
    short: "Tronco",
    muscleField: "musculo_tronco",
    fatField: "grasa_tronco",
    pair: null,
  },
  leg_left: {
    label: "Pierna izquierda",
    short: "Pierna Izq.",
    muscleField: "musculo_pierna_izq",
    fatField: "grasa_pierna_izq",
    pair: "leg_right",
  },
  leg_right: {
    label: "Pierna derecha",
    short: "Pierna Der.",
    muscleField: "musculo_pierna_der",
    fatField: "grasa_pierna_der",
    pair: "leg_left",
  },
}

/**
 * Paths in 260×430 viewBox.
 * Upper body: arms (x=56-92 and x=168-204) + torso (x=92-168), all y=78-210.
 * Legs: x=96-126 and x=134-164, y=210-392, with rounded bottoms.
 * Design matches a slim rounded-rect person icon.
 */
const ZONE_PATHS: Record<InbodySegmentRegion, string> = {
  // Right arm (appears on LEFT of screen): outer rounded corners on left side
  arm_right:
    "M 92 78 L 74 78 A 18 18 0 0 1 56 96 L 56 192 A 18 18 0 0 1 74 210 L 92 210 Z",
  // Left arm (appears on RIGHT of screen): outer rounded corners on right side
  arm_left:
    "M 168 78 L 186 78 A 18 18 0 0 0 204 96 L 204 192 A 18 18 0 0 0 186 210 L 168 210 Z",
  // Torso: center block, flat vertical edges (arms provide rounding on sides)
  torso:
    "M 92 78 L 168 78 L 168 210 L 92 210 Z",
  // Right leg (appears on LEFT of screen): rounded bottom corners
  leg_right:
    "M 96 210 L 126 210 L 126 378 Q 126 392 111 392 Q 96 392 96 378 Z",
  // Left leg (appears on RIGHT of screen): rounded bottom corners
  leg_left:
    "M 134 210 L 164 210 L 164 378 Q 164 392 149 392 Q 134 392 134 378 Z",
}

const ZONE_ANCHOR: Record<InbodySegmentRegion, { x: number; y: number; side: "left" | "right" }> = {
  arm_right: { x: 56, y: 144, side: "left" },
  arm_left: { x: 204, y: 144, side: "right" },
  torso:    { x: 204, y: 132, side: "right" },
  leg_right: { x: 96, y: 300, side: "left" },
  leg_left:  { x: 164, y: 300, side: "right" },
}

function getVal(
  m: InbodyMeasurement,
  mode: MetricMode,
  region: InbodySegmentRegion
): number | null {
  const meta = REGION_META[region]
  const key = mode === "muscle" ? meta.muscleField : meta.fatField
  const v = m[key]
  if (v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function heatOpacity(value: number | null, min: number, max: number): number {
  if (value == null) return 0.35
  if (max <= min) return 0.675
  const t = (value - min) / (max - min)
  return 0.2 + 0.8 * Math.min(1, Math.max(0, t))
}

function asymmetryPct(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null
  const mx = Math.max(Math.abs(a), Math.abs(b), 1e-6)
  return (Math.abs(a - b) / mx) * 100
}

interface Props {
  chronological: InbodyMeasurement[]
}

export default function SegmentalBalance({ chronological }: Props) {
  const [metric, setMetric] = useState<MetricMode>("muscle")
  const [activeZone, setActiveZone] = useState<InbodySegmentRegion | null>(null)

  const latest = chronological[chronological.length - 1]
  const prev = chronological.length >= 2 ? chronological[chronological.length - 2] : null

  const { minV, maxV } = useMemo(() => {
    if (!latest) return { minV: 0, maxV: 1 }
    const vals = (Object.keys(REGION_META) as InbodySegmentRegion[])
      .map((r) => getVal(latest, metric, r))
      .filter((v): v is number => v != null)
    if (vals.length === 0) return { minV: 0, maxV: 1 }
    return { minV: Math.min(...vals), maxV: Math.max(...vals) }
  }, [latest, metric])

  const baseHex = metric === "muscle" ? MUSCLE_HEX : FAT_HEX
  const baseColor = metric === "muscle" ? MUSCLE_COLOR : FAT_COLOR

  const handleZone = useCallback(
    (z: InbodySegmentRegion) => setActiveZone((p) => (p === z ? null : z)),
    []
  )

  if (!latest) return null

  const regions = Object.keys(REGION_META) as InbodySegmentRegion[]

  // active zone popup data
  const az = activeZone
  const azVal = az ? getVal(latest, metric, az) : null
  const azPrevVal = az && prev ? getVal(prev, metric, az) : null
  const azDelta = azVal != null && azPrevVal != null ? azVal - azPrevVal : null
  const azGood =
    azDelta != null
      ? metric === "muscle"
        ? azDelta >= 0
        : azDelta <= 0
      : null
  const azPairRegion = az ? REGION_META[az].pair : null
  const azPairVal = azPairRegion ? getVal(latest, metric, azPairRegion) : null
  const azAsym = azPairRegion ? asymmetryPct(azVal, azPairVal) : null
  const azField = az
    ? (metric === "muscle" ? REGION_META[az].muscleField : REGION_META[az].fatField) as string
    : null
  const azTone = azDelta != null && azField ? inbodyDeltaTone(azField, azDelta) : "neutral"
  const azSeries = az ? chronological.map((r) => getVal(r, metric, az)) : []

  return (
    <section className="px-3.5 space-y-2.5">
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ft-sub)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Balance segmental
      </h2>

      {/* Metric toggle */}
      <div
        className="flex max-w-[280px] p-0.5 rounded-xl"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {(["muscle", "fat"] as MetricMode[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMetric(id)
              setActiveZone(null)
            }}
            className="flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all"
            style={{
              background:
                metric === id
                  ? id === "muscle"
                    ? MUSCLE_HEX
                    : FAT_HEX
                  : "transparent",
              color: metric === id ? "#0B0F1C" : "var(--ft-sub)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {id === "muscle" ? "Músculo" : "Grasa"}
          </button>
        ))}
      </div>

      {/* Body SVG card */}
      <div
        className="rounded-2xl p-4 flex justify-center"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        <svg
          viewBox="0 0 260 430"
          overflow="visible"
          style={{ width: "100%", maxWidth: 160, height: "auto", display: "block" }}
          aria-label="Silueta corporal interactiva"
        >
          {/* Head */}
          <circle
            cx="130"
            cy="38"
            r="26"
            fill="#1a2236"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.2"
          />

          {/* Neck */}
          <rect x="121" y="64" width="18" height="16" fill="#1a2236" />

          {/* ghost zone backgrounds */}
          {regions.map((z) => (
            <path
              key={`bg-${z}`}
              d={ZONE_PATHS[z]}
              fill="#1a2236"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}

          {/* heat fills */}
          {regions.map((z) => {
            const active = activeZone === z
            const v = getVal(latest, metric, z)
            const pv = prev ? getVal(prev, metric, z) : null
            const delta = pv != null && v != null ? v - pv : null
            const good =
              delta != null
                ? metric === "muscle"
                  ? delta >= 0
                  : delta <= 0
                : null
            const asym = REGION_META[z].pair
              ? asymmetryPct(v, REGION_META[z].pair ? getVal(latest, metric, REGION_META[z].pair!) : null)
              : null
            const alertBorder = asym != null && asym > ASYMMETRY_THRESHOLD

            return (
              <path
                key={z}
                d={ZONE_PATHS[z]}
                fill={baseHex}
                fillOpacity={heatOpacity(v, minV, maxV)}
                stroke={
                  active
                    ? "white"
                    : alertBorder
                      ? FAT_HEX
                      : good === true
                        ? MUSCLE_HEX
                        : good === false
                          ? "#F87171"
                          : "transparent"
                }
                strokeWidth={active ? 1.5 : good != null || alertBorder ? 0.8 : 0}
                style={{ cursor: "pointer" }}
                onClick={() => handleZone(z)}
              />
            )
          })}

          {/* Leader lines + labels */}
          {regions.map((z) => {
            const { x, y, side } = ZONE_ANCHOR[z]
            const active = activeZone === z
            const v = getVal(latest, metric, z)
            const pv = prev ? getVal(prev, metric, z) : null
            const delta = pv != null && v != null ? v - pv : null
            const good =
              delta != null
                ? metric === "muscle"
                  ? delta >= 0
                  : delta <= 0
                : null
            const lx = side === "left" ? x - 10 : x + 10
            const ex = side === "left" ? lx - 32 : lx + 32
            const ta = side === "left" ? "end" : "start"
            const lc = active ? "white" : "#64748B"
            const parts = REGION_META[z].short.split(" ")

            return (
              <g key={`lbl-${z}`} onClick={() => handleZone(z)} style={{ cursor: "pointer" }}>
                <line
                  x1={x}
                  y1={y}
                  x2={lx}
                  y2={y}
                  stroke={active ? "white" : "rgba(255,255,255,0.2)"}
                  strokeWidth={active ? 1.2 : 0.8}
                />
                <line
                  x1={lx}
                  y1={y}
                  x2={ex}
                  y2={y}
                  stroke={active ? "white" : "rgba(255,255,255,0.2)"}
                  strokeWidth={active ? 1.2 : 0.8}
                />
                <text
                  x={ex + (side === "left" ? -3 : 3)}
                  y={y - 5}
                  textAnchor={ta}
                  fontSize="7.5"
                  fill={lc}
                  fontFamily="Space Grotesk,sans-serif"
                  fontWeight={active ? "700" : "500"}
                >
                  {parts[0]} {parts[1] ?? ""}
                </text>
                <text
                  x={ex + (side === "left" ? -3 : 3)}
                  y={y + 7}
                  textAnchor={ta}
                  fontSize="8"
                  fill={active ? baseHex : "#94A3B8"}
                  fontFamily="Space Grotesk,sans-serif"
                  fontWeight="600"
                >
                  {v != null ? `${v.toFixed(2)}kg` : "—"}
                </text>
                {delta != null && (
                  <text
                    x={ex + (side === "left" ? -3 : 3)}
                    y={y + 17}
                    textAnchor={ta}
                    fontSize="6.5"
                    fill={good ? MUSCLE_HEX : "#F87171"}
                    fontFamily="Space Grotesk,sans-serif"
                  >
                    {delta >= 0 ? "▲" : "▼"}
                    {Math.abs(delta).toFixed(2)}
                  </text>
                )}
              </g>
            )
          })}

          {/* Scale gradient */}
          <defs>
            <linearGradient id="sg_scale" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={baseHex} stopOpacity="0.15" />
              <stop offset="100%" stopColor={baseHex} stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect x="90" y="404" width="80" height="5" rx="2.5" fill="url(#sg_scale)" />
          <text x="90" y="415" fill="#64748B" fontSize="6.5" fontFamily="Space Grotesk,sans-serif">
            min
          </text>
          <text
            x="170"
            y="415"
            fill="#64748B"
            fontSize="6.5"
            textAnchor="end"
            fontFamily="Space Grotesk,sans-serif"
          >
            max
          </text>
        </svg>
      </div>

      {/* Active zone popup */}
      {az && azVal != null && (
        <div
          className="rounded-2xl p-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${baseHex}33`,
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <div
                className="font-semibold"
                style={{ fontSize: 13, color: "var(--ft-text)" }}
              >
                {REGION_META[az].label}
              </div>
              <div style={{ fontSize: 10, color: "var(--ft-sub)" }}>
                {metric === "muscle" ? "Masa muscular" : "Masa grasa"}
              </div>
            </div>
            <button
              onClick={() => setActiveZone(null)}
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
          <div
            className="font-bold"
            style={{ fontSize: 28, color: baseHex }}
          >
            {formatDecimal(azVal, 2)}
            <span style={{ fontSize: 13, color: "var(--ft-sub)" }}> kg</span>
          </div>
          {azDelta != null && (
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color: inbodyDeltaColor(azTone),
              }}
            >
              {formatSignedDelta(azDelta, "kg")} vs anterior
            </div>
          )}
          {azAsym != null && (
            <>
              <div style={{ fontSize: 10, color: "var(--ft-sub)", marginTop: 8, marginBottom: 3 }}>
                Asimetría vs par:{" "}
                <span
                  style={{
                    color: azAsym > ASYMMETRY_THRESHOLD ? "var(--ft-amber)" : "var(--ft-green)",
                    fontWeight: 600,
                  }}
                >
                  {azAsym.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, azAsym * 5)}%`,
                    height: "100%",
                    background:
                      azAsym > ASYMMETRY_THRESHOLD ? "var(--ft-amber)" : "var(--ft-green)",
                    borderRadius: 2,
                  }}
                />
              </div>
            </>
          )}
          {azSeries.length > 1 && (
            <div className="mt-3">
              <div
                style={{
                  fontSize: 9,
                  color: "var(--ft-sub)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Evolución
              </div>
              <InbodyMiniSparkline values={azSeries} color={baseHex} />
            </div>
          )}
        </div>
      )}

      {!activeZone && (
        <p style={{ fontSize: 11, color: "var(--ft-sub)" }}>
          Toca una zona para ver detalle
        </p>
      )}
    </section>
  )
}
