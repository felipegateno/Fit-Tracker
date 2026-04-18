import InbodyMiniSparkline from "@/components/InbodyMiniSparkline"
import {
  formatDecimal,
  formatSignedDelta,
  inbodyDeltaColor,
  inbodyDeltaTone,
} from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

const WATER_COLOR = "#378ADD"
const TMB_COLOR = "#D85A30"

interface Props {
  chronological: InbodyMeasurement[]
}

function pick(rows: InbodyMeasurement[], key: keyof InbodyMeasurement): (number | null)[] {
  return rows.map((r) => {
    const v = r[key]
    if (v == null) return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  })
}

export default function InbodyMetabolicGrid({ chronological }: Props) {
  const latest = chronological[chronological.length - 1]
  const prev = chronological.length >= 2 ? chronological[chronological.length - 2] : null
  if (!latest) return null

  const tmb = latest.tmb != null ? Number(latest.tmb) : null
  const tmbPrev = prev?.tmb != null ? Number(prev.tmb) : null
  const water = latest.agua_corporal != null ? Number(latest.agua_corporal) : null
  const waterPrev = prev?.agua_corporal != null ? Number(prev.agua_corporal) : null

  const dTmb = tmb != null && tmbPrev != null ? tmb - tmbPrev : null
  const dWater = water != null && waterPrev != null ? water - waterPrev : null
  const toneTmb = dTmb != null ? inbodyDeltaTone("tmb", dTmb, 1) : "neutral"
  const toneWater = dWater != null ? inbodyDeltaTone("agua_corporal", dWater) : "neutral"

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Metabolismo e hidratación</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">TMB</span>
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xl font-bold text-white tabular-nums">
                {tmb != null ? formatDecimal(tmb, 0) : "—"}
              </span>
              <span className="text-xs text-gray-500">kcal/día</span>
            </div>
            <InbodyMiniSparkline values={pick(chronological, "tmb")} color={TMB_COLOR} />
          </div>
          {dTmb != null && (
            <span className="text-xs tabular-nums" style={{ color: inbodyDeltaColor(toneTmb) }}>
              vs ant.: {formatSignedDelta(dTmb, "kcal")}
            </span>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Agua corporal</span>
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xl font-bold text-white tabular-nums">
                {water != null ? formatDecimal(water, 2) : "—"}
              </span>
              <span className="text-xs text-gray-500">L</span>
            </div>
            <InbodyMiniSparkline values={pick(chronological, "agua_corporal")} color={WATER_COLOR} />
          </div>
          {dWater != null && (
            <span className="text-xs tabular-nums" style={{ color: inbodyDeltaColor(toneWater) }}>
              vs ant.: {formatSignedDelta(dWater, "L")}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
