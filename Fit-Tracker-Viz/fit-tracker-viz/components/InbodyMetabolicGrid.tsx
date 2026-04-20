import InbodyMiniSparkline from "@/components/InbodyMiniSparkline"
import {
  formatDecimal,
  formatSignedDelta,
  inbodyDeltaColor,
  inbodyDeltaTone,
} from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

const WATER_COLOR = "#4F8EF7"
const TMB_COLOR = "#F59E0B"

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

  const cardStyle = { background: "var(--ft-card)", border: "1px solid var(--ft-border)" }

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
        Metabolismo e hidratación
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={cardStyle}>
          <span style={{ fontSize: 11, color: "var(--ft-sub)", fontWeight: 500 }}>TMB</span>
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xl font-bold tabular-nums" style={{ color: "var(--ft-text)" }}>
                {tmb != null ? formatDecimal(tmb, 0) : "—"}
              </span>
              <span style={{ fontSize: 11, color: "var(--ft-sub)" }}>kcal/día</span>
            </div>
            <InbodyMiniSparkline values={pick(chronological, "tmb")} color={TMB_COLOR} />
          </div>
          {dTmb != null && (
            <span className="text-xs tabular-nums" style={{ color: inbodyDeltaColor(toneTmb) }}>
              vs ant.: {formatSignedDelta(dTmb, "kcal")}
            </span>
          )}
        </div>
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={cardStyle}>
          <span style={{ fontSize: 11, color: "var(--ft-sub)", fontWeight: 500 }}>Agua corporal</span>
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xl font-bold tabular-nums" style={{ color: "var(--ft-text)" }}>
                {water != null ? formatDecimal(water, 2) : "—"}
              </span>
              <span style={{ fontSize: 11, color: "var(--ft-sub)" }}>L</span>
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
