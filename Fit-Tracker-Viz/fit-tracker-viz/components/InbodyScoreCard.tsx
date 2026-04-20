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
        Puntuación InBody
      </h2>
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        <span
          className="font-bold tabular-nums"
          style={{ fontSize: 48, color: score != null ? barColor : "var(--ft-sub)" }}
        >
          {score != null ? Math.round(Number(score)) : "—"}
        </span>
        {dPrev != null && (
          <span
            className="text-sm font-medium tabular-nums"
            style={{ color: inbodyDeltaColor(tone) }}
          >
            vs anterior: {formatSignedDelta(dPrev, "pts")}
          </span>
        )}
        <div className="w-full space-y-1">
          <div
            className="h-3 rounded-full overflow-hidden w-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <div
            className="flex justify-between uppercase tracking-wide"
            style={{ fontSize: 10, color: "var(--ft-sub)" }}
          >
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </section>
  )
}
