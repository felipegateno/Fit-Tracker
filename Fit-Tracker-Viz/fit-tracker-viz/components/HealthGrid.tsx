import { formatNum, secondsToHM } from "@/lib/utils"
import type { GarminDailyHealth, GarminSleep, GarminHrv, GarminTrainingReadiness } from "@/types"

interface Props {
  health: GarminDailyHealth | null
  sleep: GarminSleep | null
  hrv: GarminHrv | null
  readiness: GarminTrainingReadiness | null
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

export default function HealthGrid({ health, sleep, hrv, readiness }: Props) {
  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Salud Garmin</h2>
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label="FC reposo"
            value={health?.resting_hr ?? "—"}
            unit={health?.resting_hr != null ? "bpm" : undefined}
          />
          <MetricCard
            label="Body Battery"
            value={health?.body_battery_highest ?? "—"}
            unit={health?.body_battery_highest != null ? "max" : undefined}
            sub={health?.body_battery_lowest != null ? `mín ${health.body_battery_lowest}` : undefined}
            color={health?.body_battery_highest != null
              ? health.body_battery_highest >= 50 ? "#1D9E75" : "#EF9F27"
              : undefined}
          />
          <MetricCard
            label="Estrés"
            value={health?.avg_stress ?? "—"}
            sub={health?.avg_stress != null ? (health.avg_stress < 26 ? "bajo" : health.avg_stress < 51 ? "medio" : "alto") : undefined}
          />
          <MetricCard
            label="SpO₂"
            value={sleep?.avg_spo2 != null ? Math.round(sleep.avg_spo2) : "—"}
            unit={sleep?.avg_spo2 != null ? "%" : undefined}
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
