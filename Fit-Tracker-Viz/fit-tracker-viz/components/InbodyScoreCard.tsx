import { formatSignedDelta, inbodyDeltaColor, inbodyDeltaTone } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

interface Props {
  latest: InbodyMeasurement
  prev: InbodyMeasurement | null
}

function scoreColor(score: number): string {
  if (score >= 80) return "#1D9E75"
  if (score >= 70) return "#EF9F27"
  return "#f87171"
}

export default function InbodyScoreCard({ latest, prev }: Props) {
  const score = latest.puntuacion_inbody
  const prevScore = prev?.puntuacion_inbody ?? null
  const dPrev =
    score != null && prevScore != null ? Number(score) - Number(prevScore) : null
  const tone = dPrev != null ? inbodyDeltaTone("puntuacion_inbody", dPrev, 0.5) : "neutral"
  const pct = score != null ? Math.min(100, Math.max(0, Number(score))) : 0
  const barColor = score != null ? scoreColor(Number(score)) : "#4b5563"

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Puntuación InBody</h2>
      <div className="bg-gray-900 rounded-xl p-5 flex flex-col items-center gap-3">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color: score != null ? barColor : "#9ca3af" }}
        >
          {score != null ? Math.round(Number(score)) : "—"}
        </span>
        {dPrev != null && (
          <span className="text-sm font-medium tabular-nums" style={{ color: inbodyDeltaColor(tone) }}>
            vs anterior: {formatSignedDelta(dPrev, "pts")}
          </span>
        )}
        <div className="w-full space-y-1">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden w-full">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wide">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </section>
  )
}
