import { formatNum, secondsToHM } from "@/lib/utils"
import type {
  GarminDailyHealth,
  GarminSleep,
  DailyTotals,
  DailyGoals,
  DashboardDayPoint,
} from "@/types"

interface Props {
  totals: DailyTotals
  goals: DailyGoals | null
  health: GarminDailyHealth | null
  sleep: GarminSleep | null
  numDays: number
  daySeries: DashboardDayPoint[]
  rangeLabel: string | null
}

function KpiCard({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

function meanSteps(series: DashboardDayPoint[]): number {
  if (series.length === 0) return 0
  const sum = series.reduce((s, d) => s + d.total_steps, 0)
  return Math.round(sum / series.length)
}

function meanSleepSeconds(series: DashboardDayPoint[]): number | null {
  const withSleep = series.filter((d) => d.sleep_seconds != null && d.sleep_seconds > 0)
  if (withSleep.length === 0) return null
  const sum = withSleep.reduce((s, d) => s + (d.sleep_seconds ?? 0), 0)
  return Math.round(sum / withSleep.length)
}

function meanConsumidas(series: DashboardDayPoint[]): number {
  if (series.length === 0) return 0
  return Math.round(series.reduce((s, d) => s + d.consumidas, 0) / series.length)
}

function meanQuemadas(series: DashboardDayPoint[]): number {
  if (series.length === 0) return 0
  return Math.round(series.reduce((s, d) => s + d.quemadas, 0) / series.length)
}

export default function KpiGrid({
  totals,
  goals,
  health,
  sleep,
  numDays,
  daySeries,
  rangeLabel,
}: Props) {
  const meta = goals?.calories_goal ?? 2000

  const singleDay = numDays === 1
  const consumidas = singleDay ? Math.round(totals.total_calories) : meanConsumidas(daySeries)
  const quemadas = singleDay ? health?.total_calories ?? null : meanQuemadas(daySeries)
  const deficit = quemadas != null ? consumidas - quemadas : null

  const stepsValue = singleDay
    ? health?.total_steps != null
      ? formatNum(health.total_steps)
      : "—"
    : formatNum(meanSteps(daySeries))

  const stepsSub = singleDay
    ? health?.step_goal
      ? `meta ${formatNum(health.step_goal)}`
      : undefined
    : rangeLabel
      ? rangeLabel
      : undefined

  const avgSleepSec = !singleDay ? meanSleepSeconds(daySeries) : null
  const sleepHours = singleDay
    ? sleep?.total_sleep_seconds
      ? secondsToHM(sleep.total_sleep_seconds)
      : "—"
    : avgSleepSec != null
      ? secondsToHM(avgSleepSec)
      : "—"

  const sleepSub = singleDay
    ? sleep?.sleep_score != null
      ? `score ${sleep.sleep_score}`
      : undefined
    : rangeLabel
      ? rangeLabel
      : undefined

  const balanceSub = rangeLabel ?? undefined

  return (
    <section className="px-4 space-y-3">
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Balance energético</span>
          {deficit != null && (
            <span className={`text-sm font-semibold ${deficit < 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {deficit < 0 ? `−${formatNum(Math.abs(deficit))}` : `+${formatNum(deficit)}`} kcal
            </span>
          )}
        </div>
        {balanceSub && <span className="text-xs text-gray-500 block -mt-1">{balanceSub}</span>}
        <BalanceBar label="Consumidas" value={consumidas} max={meta} color="#5DCAA5" />
        <BalanceBar label="Quemadas" value={quemadas ?? 0} max={meta} color="#D85A30" />
        <BalanceBar label="Meta" value={meta} max={meta} color="#4B5563" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Pasos" value={stepsValue} sub={stepsSub} />
        <KpiCard label="Sueño" value={sleepHours} sub={sleepSub} />
      </div>
    </section>
  )
}

function BalanceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-medium">{formatNum(value)} kcal</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
