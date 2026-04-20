import InbodyMiniSparkline from "@/components/InbodyMiniSparkline"
import {
  formatDecimal,
  formatSignedDelta,
  inbodyDeltaColor,
  inbodyDeltaTone,
} from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

const MUSCLE = "#22C55E"

interface Props {
  chronological: InbodyMeasurement[]
}

function pick(
  rows: InbodyMeasurement[],
  key: keyof InbodyMeasurement
): (number | null)[] {
  return rows.map((r) => {
    const v = r[key]
    return typeof v === "number" ? v : v != null ? Number(v) : null
  })
}

function KpiTile({
  label,
  field,
  unit,
  decimals,
  current,
  prev,
  first,
  series,
  hasMultipleMeasurements,
}: {
  label: string
  field: string
  unit: string
  decimals: number
  current: number | null
  prev: number | null
  first: number | null
  series: (number | null)[]
  hasMultipleMeasurements: boolean
}) {
  const dPrev = current != null && prev != null ? current - prev : null
  const dFirst = current != null && first != null ? current - first : null
  const tonePrev = dPrev != null ? inbodyDeltaTone(field, dPrev, decimals === 0 ? 0.5 : 0.05) : "neutral"
  const toneFirst = dFirst != null ? inbodyDeltaTone(field, dFirst, decimals === 0 ? 0.5 : 0.05) : "neutral"

  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-1 min-h-[7.5rem]"
      style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
    >
      <span
        style={{
          fontSize: 9,
          color: "var(--ft-sub)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-1 min-w-0">
          <span
            className="font-bold tabular-nums truncate"
            style={{ fontSize: 20, color: "var(--ft-text)" }}
          >
            {current != null ? formatDecimal(current, decimals) : "—"}
          </span>
          {unit && (
            <span style={{ fontSize: 9, color: "var(--ft-sub)", flexShrink: 0 }}>{unit}</span>
          )}
        </div>
        <InbodyMiniSparkline values={series} color={MUSCLE} />
      </div>
      {dPrev != null && (
        <span className="text-xs tabular-nums" style={{ color: inbodyDeltaColor(tonePrev) }}>
          vs anterior: {formatSignedDelta(dPrev, unit)}
        </span>
      )}
      {dFirst != null && hasMultipleMeasurements && (
        <span className="tabular-nums" style={{ fontSize: 11, color: "var(--ft-sub)" }}>
          vs primera:{" "}
          <span style={{ color: inbodyDeltaColor(toneFirst) }}>{formatSignedDelta(dFirst, unit)}</span>
        </span>
      )}
    </div>
  )
}

export default function InbodyKpiGrid({ chronological }: Props) {
  const latest = chronological[chronological.length - 1]
  const prev = chronological.length >= 2 ? chronological[chronological.length - 2] : null
  const first = chronological[0]

  if (!latest) {
    return (
      <section className="px-4">
        <p className="text-sm text-gray-500">Sin mediciones InBody.</p>
      </section>
    )
  }

  const rows = chronological
  const hasMultipleMeasurements = rows.length > 1

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
        Composición corporal
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Peso"
          field="peso"
          unit="kg"
          decimals={2}
          current={latest.peso}
          prev={prev?.peso ?? null}
          first={first.peso}
          series={pick(rows, "peso")}
          hasMultipleMeasurements={hasMultipleMeasurements}
        />
        <KpiTile
          label="Masa muscular"
          field="masa_muscular"
          unit="kg"
          decimals={2}
          current={latest.masa_muscular}
          prev={prev?.masa_muscular ?? null}
          first={first.masa_muscular}
          series={pick(rows, "masa_muscular")}
          hasMultipleMeasurements={hasMultipleMeasurements}
        />
        <KpiTile
          label="Masa grasa"
          field="masa_grasa"
          unit="kg"
          decimals={2}
          current={latest.masa_grasa}
          prev={prev?.masa_grasa ?? null}
          first={first.masa_grasa}
          series={pick(rows, "masa_grasa")}
          hasMultipleMeasurements={hasMultipleMeasurements}
        />
        <KpiTile
          label="% Grasa"
          field="porcentaje_grasa"
          unit="%"
          decimals={2}
          current={latest.porcentaje_grasa}
          prev={prev?.porcentaje_grasa ?? null}
          first={first.porcentaje_grasa}
          series={pick(rows, "porcentaje_grasa")}
          hasMultipleMeasurements={hasMultipleMeasurements}
        />
      </div>
      <KpiTile
        label="Grasa visceral"
        field="grasa_visceral"
        unit="nivel"
        decimals={0}
        current={latest.grasa_visceral != null ? Number(latest.grasa_visceral) : null}
        prev={prev?.grasa_visceral != null ? Number(prev.grasa_visceral) : null}
        first={first.grasa_visceral != null ? Number(first.grasa_visceral) : null}
        series={pick(rows, "grasa_visceral").map((n) => (n != null ? Math.round(n) : null))}
        hasMultipleMeasurements={hasMultipleMeasurements}
      />
    </section>
  )
}
