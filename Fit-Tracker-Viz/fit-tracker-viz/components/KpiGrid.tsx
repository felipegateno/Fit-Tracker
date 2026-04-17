import { formatNum, secondsToHM } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
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

/** Dias con datos de Garmin (pasos o calorias quemadas > 0). */
function daysWithHealthData(series: DashboardDayPoint[]): DashboardDayPoint[] {
  return series.filter((d) => d.total_steps > 0 || d.quemadas > 0)
}

/** Dias con datos de nutricion (consumidas > 0). */
function daysWithNutritionData(series: DashboardDayPoint[]): DashboardDayPoint[] {
  return series.filter((d) => d.consumidas > 0)
}

function meanSteps(series: DashboardDayPoint[]): number {
  const valid = daysWithHealthData(series)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((s, d) => s + d.total_steps, 0) / valid.length)
}

function meanSleepSeconds(series: DashboardDayPoint[]): number | null {
  const withSleep = series.filter((d) => d.sleep_seconds != null && d.sleep_seconds > 0)
  if (withSleep.length === 0) return null
  const sum = withSleep.reduce((s, d) => s + (d.sleep_seconds ?? 0), 0)
  return Math.round(sum / withSleep.length)
}

function meanConsumidas(series: DashboardDayPoint[]): number {
  const valid = daysWithNutritionData(series)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((s, d) => s + d.consumidas, 0) / valid.length)
}

function meanQuemadas(series: DashboardDayPoint[]): number {
  const valid = daysWithHealthData(series)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((s, d) => s + d.quemadas, 0) / valid.length)
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

  const consumidasPct = meta > 0 ? (consumidas / meta) * 100 : 0
  const consumidasOver = consumidasPct > 100
  const barMax = Math.max(consumidasPct, 100)
  const consumidasNormalW = (Math.min(consumidasPct, 100) / barMax) * 100
  const consumidasExcessW = consumidasOver ? ((consumidasPct - 100) / barMax) * 100 : 0
  const consumidasMarkerLeft = (100 / barMax) * 100

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

        {/* Consumidas / Meta bar (merged) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Consumidas / Meta</span>
            <span className="text-gray-300 font-medium">
              {formatNum(consumidas)} / {formatNum(meta)} kcal
            </span>
          </div>
          <div className="relative pt-0.5">
            <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden w-full flex">
              <div
                className={`h-full shrink-0 ${consumidasOver ? "rounded-l-full" : "rounded-full"}`}
                style={{ width: `${consumidasNormalW}%`, backgroundColor: "#5DCAA5" }}
              />
              {consumidasOver && (
                <div
                  className="h-full rounded-r-full shrink-0"
                  style={{ width: `${consumidasExcessW}%`, backgroundColor: "#f97316" }}
                />
              )}
            </div>
            {consumidasOver && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none opacity-90 rounded-full"
                style={{ left: `${consumidasMarkerLeft}%`, transform: "translateX(-50%)" }}
                aria-hidden
              />
            )}
          </div>
        </div>

        {/* Quemadas bar */}
        <BalanceBar label="Quemadas" value={quemadas ?? 0} max={meta} color="#D85A30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Pasos" value={stepsValue} sub={stepsSub} />
        <KpiCard label="Sueño" value={sleepHours} sub={sleepSub} />
      </div>

      {singleDay && <GarminSyncBadge lastSync={health?.garmin_last_sync ?? null} />}
    </section>
  )
}

function GarminSyncBadge({ lastSync }: { lastSync: string | null }) {
  if (!lastSync) return null

  const syncDate = new Date(lastSync)
  const ageMs = Date.now() - syncDate.getTime()
  const ageMinutes = ageMs / 60_000

  let dotColor: string
  let label: string
  if (ageMinutes < 60) {
    dotColor = "bg-emerald-400"
    label = "Garmin actualizado"
  } else if (ageMinutes < 180) {
    dotColor = "bg-yellow-400"
    label = "Garmin desactualizado"
  } else {
    dotColor = "bg-rose-400"
    label = "Garmin sin sync"
  }

  const ago = formatDistanceToNow(syncDate, { addSuffix: true, locale: es })

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label} · {ago}</span>
    </div>
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
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
