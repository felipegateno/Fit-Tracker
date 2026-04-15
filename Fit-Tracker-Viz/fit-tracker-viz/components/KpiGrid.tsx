import { formatNum, secondsToHM } from "@/lib/utils"
import type { GarminDailyHealth, GarminSleep, DailyTotals, DailyGoals } from "@/types"

interface Props {
  totals: DailyTotals
  goals: DailyGoals | null
  health: GarminDailyHealth | null
  sleep: GarminSleep | null
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

export default function KpiGrid({ totals, goals, health, sleep }: Props) {
  const consumidas = Math.round(totals.total_calories)
  const quemadas = health?.total_calories ?? null
  const meta = goals?.calories_goal ?? 2000
  const deficit = quemadas != null ? quemadas - consumidas : null

  const sleepHours = sleep?.total_sleep_seconds
    ? secondsToHM(sleep.total_sleep_seconds)
    : "—"

  return (
    <section className="px-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Pasos"
          value={health?.total_steps != null ? formatNum(health.total_steps) : "—"}
          sub={health?.step_goal ? `meta ${formatNum(health.step_goal)}` : undefined}
        />
        <KpiCard
          label="Sueño"
          value={sleepHours}
          sub={sleep?.sleep_score != null ? `score ${sleep.sleep_score}` : undefined}
        />
      </div>

      {/* Balance card */}
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Balance energético</span>
          {deficit != null && (
            <span className={`text-sm font-semibold ${deficit < 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {deficit < 0 ? `−${formatNum(Math.abs(deficit))}` : `+${formatNum(deficit)}`} kcal
            </span>
          )}
        </div>
        <BalanceBar label="Consumidas" value={consumidas} max={meta} color="#5DCAA5" />
        <BalanceBar label="Quemadas" value={quemadas ?? 0} max={meta} color="#D85A30" />
        <BalanceBar label="Meta" value={meta} max={meta} color="#4B5563" />
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
