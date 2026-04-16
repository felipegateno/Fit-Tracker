import type { GarminDailyHealth, GarminSleep, GarminHrv, GarminTrainingReadiness } from "@/types"
import type { DashboardMode } from "@/types"

interface Props {
  health: GarminDailyHealth | null
  sleep: GarminSleep | null
  hrv: GarminHrv | null
  readiness: GarminTrainingReadiness | null
  healthRange: GarminDailyHealth[]
  mode: DashboardMode
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  color,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold" style={color ? { color } : { color: "#f3f4f6" }}>
          {value}
        </span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
  )
}

function readinessColor(score: number): string {
  if (score >= 70) return "#1D9E75"
  if (score >= 40) return "#EF9F27"
  return "#D85A30"
}

function hrvStatusLabel(status: string | null): string {
  if (!status) return "—"
  return { BALANCED: "Equilibrado", UNBALANCED: "Desequilibrado", LOW: "Bajo" }[status] ?? status
}

function meanNullable(nums: (number | null | undefined)[]): number | null {
  const v = nums.filter((x): x is number => x != null && !Number.isNaN(x))
  if (v.length === 0) return null
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

export default function HealthGrid({ health, sleep, hrv, readiness, healthRange, mode }: Props) {
  const aggregate = mode !== "daily" && healthRange.length > 0

  const resting = aggregate
    ? meanNullable(healthRange.map((h) => h.resting_hr))
    : health?.resting_hr ?? null

  const bbHigh = aggregate
    ? meanNullable(healthRange.map((h) => h.body_battery_highest))
    : health?.body_battery_highest ?? null
  const bbLow = aggregate
    ? meanNullable(healthRange.map((h) => h.body_battery_lowest))
    : health?.body_battery_lowest ?? null

  const stress = aggregate
    ? meanNullable(healthRange.map((h) => h.avg_stress))
    : health?.avg_stress ?? null

  const intensity = aggregate
    ? healthRange.reduce((s, h) => s + (h.intensity_minutes ?? 0), 0)
    : health?.intensity_minutes ?? null

  const rangeSub =
    mode === "weekly" ? "promedio semanal (intensidad: total)" : mode === "monthly" ? "promedio mensual (intensidad: total)" : undefined

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Salud Garmin</h2>
      {rangeSub && <p className="text-xs text-gray-500 -mt-1">{rangeSub}</p>}
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label="FC reposo"
            value={resting ?? "—"}
            unit={resting != null ? "bpm" : undefined}
          />
          <MetricCard
            label="Body Battery"
            value={bbHigh ?? "—"}
            unit={bbHigh != null ? "max" : undefined}
            sub={bbLow != null ? `mín ${bbLow}` : undefined}
            color={bbHigh != null ? (bbHigh >= 50 ? "#1D9E75" : "#EF9F27") : undefined}
          />
          <MetricCard
            label="Estrés"
            value={stress ?? "—"}
            sub={
              stress != null
                ? stress < 26
                  ? "bajo"
                  : stress < 51
                    ? "medio"
                    : "alto"
                : undefined
            }
          />
          <MetricCard
            label="Min. intensidad"
            value={intensity ?? "—"}
            unit={intensity != null ? "min" : undefined}
          />
          <MetricCard
            label="HRV"
            value={hrv?.hrv_weekly_avg != null ? Math.round(hrv.hrv_weekly_avg) : "—"}
            unit={hrv?.hrv_weekly_avg != null ? "ms" : undefined}
            sub={hrvStatusLabel(hrv?.hrv_status ?? null)}
          />
          <MetricCard
            label="Readiness"
            value={readiness?.score ?? "—"}
            unit={readiness?.score != null ? "/" + readiness.level : undefined}
            color={readiness?.score != null ? readinessColor(readiness.score) : undefined}
          />
        </div>
      </div>
    </section>
  )
}
