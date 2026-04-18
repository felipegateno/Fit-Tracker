"use client"

import { Dialog, Popover } from "@base-ui/react"
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react"
import InbodyMiniSparkline from "@/components/InbodyMiniSparkline"
import {
  formatDecimal,
  formatSignedDelta,
  inbodyDeltaColor,
  inbodyDeltaTone,
} from "@/lib/utils"
import type { InbodyMeasurement, InbodySegmentRegion } from "@/types"

type MetricMode = "muscle" | "fat"

const MUSCLE_COLOR = "#1D9E75"
const FAT_COLOR = "#EF9F27"
const ASYMMETRY_THRESHOLD = 5

const REGION_META: Record<
  InbodySegmentRegion,
  {
    label: string
    muscleField: keyof InbodyMeasurement
    fatField: keyof InbodyMeasurement
    pair: InbodySegmentRegion | null
  }
> = {
  arm_left: {
    label: "Brazo izquierdo",
    muscleField: "musculo_brazo_izq",
    fatField: "grasa_brazo_izq",
    pair: "arm_right",
  },
  arm_right: {
    label: "Brazo derecho",
    muscleField: "musculo_brazo_der",
    fatField: "grasa_brazo_der",
    pair: "arm_left",
  },
  torso: {
    label: "Tronco",
    muscleField: "musculo_tronco",
    fatField: "grasa_tronco",
    pair: null,
  },
  leg_left: {
    label: "Pierna izquierda",
    muscleField: "musculo_pierna_izq",
    fatField: "grasa_pierna_izq",
    pair: "leg_right",
  },
  leg_right: {
    label: "Pierna derecha",
    muscleField: "musculo_pierna_der",
    fatField: "grasa_pierna_der",
    pair: "leg_left",
  },
}

/** Vista frontal: brazo derecho de la persona a la izquierda del SVG. */
const REGION_PATHS: Record<InbodySegmentRegion, string> = {
  arm_right:
    "M 52 76 C 36 82 24 108 28 142 C 32 168 44 176 54 170 C 62 128 70 100 78 86 C 72 74 62 72 52 76 Z",
  arm_left:
    "M 148 76 C 164 82 176 108 172 142 C 168 168 156 176 146 170 C 138 128 130 100 122 86 C 128 74 138 72 148 76 Z",
  torso: "M 76 70 L 124 70 L 128 198 L 72 198 Z",
  leg_right:
    "M 72 196 L 98 196 L 96 310 L 90 348 L 74 344 L 76 210 Z",
  leg_left:
    "M 102 196 L 128 196 L 124 210 L 126 344 L 110 348 L 104 310 Z",
}

function getVal(m: InbodyMeasurement, mode: MetricMode, region: InbodySegmentRegion): number | null {
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
  return 0.35 + 0.65 * Math.min(1, Math.max(0, t))
}

function asymmetryPct(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null
  const mx = Math.max(Math.abs(a), Math.abs(b), 1e-6)
  return (Math.abs(a - b) / mx) * 100
}

interface Props {
  chronological: InbodyMeasurement[]
}

function DetailBody({
  region,
  mode,
  chronological,
  onClose,
}: {
  region: InbodySegmentRegion
  mode: MetricMode
  chronological: InbodyMeasurement[]
  onClose: () => void
}) {
  const meta = REGION_META[region]
  const field = (mode === "muscle" ? meta.muscleField : meta.fatField) as string
  const latest = chronological[chronological.length - 1]
  const prev = chronological.length >= 2 ? chronological[chronological.length - 2] : null
  const current = getVal(latest, mode, region)
  const prevVal = prev ? getVal(prev, mode, region) : null
  const dPrev = current != null && prevVal != null ? current - prevVal : null
  const tone = dPrev != null ? inbodyDeltaTone(field, dPrev) : "neutral"

  const pairRegion = meta.pair
  const pairVal = pairRegion ? getVal(latest, mode, pairRegion) : null
  const asym = pairRegion ? asymmetryPct(current, pairVal) : null
  const series = chronological.map((row) => getVal(row, mode, region))
  const unit = "kg"
  const metricLabel = mode === "muscle" ? "Masa muscular segmental" : "Masa grasa segmental"
  const sparkColor = mode === "muscle" ? MUSCLE_COLOR : FAT_COLOR

  return (
    <div className="space-y-3 p-1 min-w-[240px] max-w-[min(100vw-2rem,320px)]">
      <div>
        <h3 className="text-base font-semibold text-white">{meta.label}</h3>
        <p className="text-xs text-gray-500">{metricLabel}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tabular-nums">
          {current != null ? formatDecimal(current, 2) : "—"}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {dPrev != null && (
        <p className="text-sm tabular-nums" style={{ color: inbodyDeltaColor(tone) }}>
          vs anterior: {formatSignedDelta(dPrev, unit)}
        </p>
      )}
      {pairRegion && current != null && pairVal != null && asym != null && (
        <div className="rounded-lg bg-gray-800/80 p-2 space-y-1">
          <p className="text-xs text-gray-400">
            vs {REGION_META[pairRegion].label}: {formatDecimal(pairVal, 2)} {unit}
          </p>
          <p className="text-xs text-gray-500">Asimetría: {formatDecimal(asym, 1)}%</p>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(100, asym)}%` }}
            />
          </div>
        </div>
      )}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Evolución</p>
        <InbodyMiniSparkline values={series} color={sparkColor} />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2 rounded-lg bg-gray-800 text-sm font-medium text-gray-200 hover:bg-gray-700 border border-gray-700"
      >
        Cerrar
      </button>
    </div>
  )
}

export default function SegmentalBalance({ chronological }: Props) {
  const [metric, setMetric] = useState<MetricMode>("muscle")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<InbodySegmentRegion | null>(null)
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const latest = chronological[chronological.length - 1]

  const { minV, maxV } = useMemo(() => {
    if (!latest) return { minV: 0, maxV: 1 }
    const vals = (Object.keys(REGION_META) as InbodySegmentRegion[])
      .map((r) => getVal(latest, metric, r))
      .filter((v): v is number => v != null)
    if (vals.length === 0) return { minV: 0, maxV: 1 }
    return { minV: Math.min(...vals), maxV: Math.max(...vals) }
  }, [latest, metric])

  const baseColor = metric === "muscle" ? MUSCLE_COLOR : FAT_COLOR

  const openRegion = useCallback((region: InbodySegmentRegion, el: Element) => {
    setSelected(region)
    setAnchorEl(el)
    setOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    setOpen(false)
    setSelected(null)
    setAnchorEl(null)
  }, [])

  const onPathClick = (region: InbodySegmentRegion) => (e: MouseEvent<SVGPathElement>) => {
    e.stopPropagation()
    openRegion(region, e.currentTarget)
  }

  const onPathKeyDown =
    (region: InbodySegmentRegion) => (e: KeyboardEvent<SVGPathElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openRegion(region, e.currentTarget)
      }
    }

  if (!latest) return null

  const regions = Object.keys(REGION_META) as InbodySegmentRegion[]

  const popupContent =
    selected && (
      <DetailBody
        region={selected}
        mode={metric}
        chronological={chronological}
        onClose={closeDetail}
      />
    )

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Balance segmental</h2>
      <p className="text-xs text-gray-500 -mt-1">Toca una zona del cuerpo para ver detalle.</p>

      <div className="flex gap-1 p-1 bg-gray-900 rounded-full max-w-[280px]">
        <button
          type="button"
          onClick={() => setMetric("muscle")}
          className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
            metric === "muscle" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Músculo
        </button>
        <button
          type="button"
          onClick={() => setMetric("fat")}
          className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
            metric === "fat" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Grasa
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center">
        <svg
          viewBox="0 0 200 360"
          className="w-full max-w-[220px] h-auto select-none"
          aria-label="Silueta corporal interactiva"
        >
          <path
            d="M 100 26 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0"
            fill="#374151"
            pointerEvents="none"
          />
          <path d="M 88 52 L 112 52 L 110 70 L 90 70 Z" fill="#374151" pointerEvents="none" />

          {regions.map((region) => {
            const v = getVal(latest, metric, region)
            const opacity = heatOpacity(v, minV, maxV)
            const meta = REGION_META[region]
            const pair = meta.pair
            let alertStroke = "none"
            if (pair) {
              const pv = getVal(latest, metric, pair)
              const asym = asymmetryPct(v, pv)
              if (asym != null && asym > ASYMMETRY_THRESHOLD) alertStroke = "#fbbf24"
            }
            const label = `${meta.label}${v != null ? `, ${formatDecimal(v, 2)} kg` : ""}`
            return (
              <path
                key={region}
                d={REGION_PATHS[region]}
                fill={baseColor}
                fillOpacity={opacity}
                stroke={alertStroke}
                strokeWidth={alertStroke !== "none" ? 1.5 : 0}
                className="cursor-pointer hover:stroke-white hover:stroke-2 transition-[stroke]"
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={onPathClick(region)}
                onKeyDown={onPathKeyDown(region)}
              />
            )
          })}
        </svg>

        <div className="mt-4 w-full flex items-center gap-2 text-[10px] text-gray-500">
          <span className="shrink-0">menor</span>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${baseColor}55, ${baseColor})`,
            }}
          />
          <span className="shrink-0">mayor</span>
        </div>
        <p className="text-[10px] text-amber-400/90 mt-2 text-center">
          Borde ámbar: asimetría &gt; {ASYMMETRY_THRESHOLD}%
        </p>
      </div>

      {isDesktop === true ? (
        <Popover.Root
          open={open && selected != null}
          onOpenChange={(next) => {
            if (!next) closeDetail()
          }}
          modal={false}
        >
          <Popover.Portal>
            <Popover.Positioner
              side="top"
              align="center"
              sideOffset={8}
              anchor={anchorEl ? () => anchorEl : null}
            >
              <Popover.Popup className="z-[200] rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl outline-none">
                <Popover.Close className="sr-only" aria-label="Cerrar" />
                {popupContent}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <Dialog.Root
          open={open && selected != null}
          onOpenChange={(next) => {
            if (!next) closeDetail()
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm" />
            <Dialog.Popup className="fixed left-2 right-2 bottom-2 z-[200] rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-xl outline-none sm:left-auto sm:right-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:min-w-[300px]">
              <Dialog.Title className="sr-only">
                {selected ? REGION_META[selected].label : "Detalle"}
              </Dialog.Title>
              <Dialog.Close className="sr-only" aria-label="Cerrar diálogo" />
              {popupContent}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </section>
  )
}
