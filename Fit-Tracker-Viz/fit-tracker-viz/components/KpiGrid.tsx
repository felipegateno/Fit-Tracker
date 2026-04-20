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

/** Dias con datos de Garmin */
function daysWithHealthData(series: DashboardDayPoint[]): DashboardDayPoint[] {
  return series.filter((d) => d.total_steps > 0 || d.quemadas > 0)
}

/** Dias con datos de nutricion */
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

/** SVG ring progress indicator */
function Ring({
  size = 100,
  sw = 9,
  pct,
  color,
  children,
}: {
  size?: number
  sw?: number
  pct: number
  color: string
  children?: React.ReactNode
}) {
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * c
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  )
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
  const quemadas = singleDay ? (health?.total_calories ?? null) : meanQuemadas(daySeries)
  const balance = quemadas != null ? consumidas - quemadas : null

  const stepCount = singleDay ? (health?.total_steps ?? 0) : meanSteps(daySeries)
  const stepGoal = singleDay ? (health?.step_goal ?? 10000) : 10000
  const stepsPct = stepGoal > 0 ? (stepCount / stepGoal) * 100 : 0

  const sleepSec = singleDay ? (sleep?.total_sleep_seconds ?? null) : meanSleepSeconds(daySeries)
  const sleepLabel = sleepSec != null ? secondsToHM(sleepSec) : "—"
  const sleepScore = singleDay ? (sleep?.sleep_score ?? null) : null

  // sleep phase seconds (single-day only)
  const deepSec = sleep?.deep_sleep_seconds ?? 0
  const remSec = sleep?.rem_sleep_seconds ?? 0
  const lightSec = sleep?.light_sleep_seconds ?? 0
  const totalPhaseSec = deepSec + remSec + lightSec
  const hasPhases = singleDay && totalPhaseSec > 0

  const consumidasPct = meta > 0 ? (consumidas / meta) * 100 : 0
  const accentColor = "var(--ft-accent)"
  const ringColor =
    consumidasPct > 110 ? "var(--ft-amber)" : accentColor

  return (
    <section className="px-3.5 space-y-2.5">
      {/* ── Calorie ring card ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
      >
        {rangeLabel && (
          <div className="text-xs mb-3" style={{ color: "var(--ft-sub)" }}>
            {rangeLabel}
          </div>
        )}
        <div className="flex items-center gap-4">
          <Ring size={100} sw={9} pct={consumidasPct} color={ringColor}>
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div
                className="font-bold"
                style={{ fontSize: 17, color: "var(--ft-text)" }}
              >
                {(consumidas / 1000).toFixed(1)}k
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--ft-sub)",
                  letterSpacing: "0.05em",
                  marginTop: 2,
                }}
              >
                KCAL
              </div>
            </div>
          </Ring>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ft-sub)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Consumidas
              </div>
              <div
                className="font-bold"
                style={{ fontSize: 22, color: "var(--ft-text)", lineHeight: 1.1 }}
              >
                {formatNum(consumidas)}
              </div>
              <div style={{ fontSize: 11, color: "var(--ft-sub)" }}>
                meta {formatNum(meta)} kcal
              </div>
            </div>
            <div
              style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 10 }}
            />
            <div className="flex justify-between">
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ft-sub)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Quemadas
                </div>
                <div
                  className="font-semibold"
                  style={{ fontSize: 16, color: "var(--ft-text)" }}
                >
                  {quemadas != null ? formatNum(quemadas) : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ft-sub)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Balance
                </div>
                <div
                  className="font-semibold"
                  style={{
                    fontSize: 16,
                    color:
                      balance == null
                        ? "var(--ft-sub2)"
                        : balance <= 0
                          ? "var(--ft-green)"
                          : "var(--ft-red)",
                  }}
                >
                  {balance == null
                    ? "—"
                    : `${balance > 0 ? "+" : ""}${formatNum(balance)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Steps + Sleep row ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Steps */}
        <div
          className="rounded-2xl p-3.5"
          style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ft-sub)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Pasos
          </div>
          <Ring size={74} sw={7} pct={stepsPct} color={stepsPct >= 100 ? "var(--ft-green)" : accentColor}>
            <div
              className="font-bold"
              style={{ fontSize: 13, color: "var(--ft-text)" }}
            >
              {stepCount > 0 ? `${(stepCount / 1000).toFixed(1)}k` : "—"}
            </div>
          </Ring>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--ft-sub)" }}>
            meta {(stepGoal / 1000).toFixed(0)}k ·{" "}
            <span
              style={{
                color: stepsPct >= 100 ? "var(--ft-green)" : "var(--ft-sub2)",
                fontWeight: 600,
              }}
            >
              {Math.round(stepsPct)}%
            </span>
          </div>
        </div>

        {/* Sleep */}
        <div
          className="rounded-2xl p-3.5"
          style={{ background: "var(--ft-card)", border: "1px solid var(--ft-border)" }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ft-sub)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Sueño
          </div>
          <div
            className="font-bold"
            style={{ fontSize: 26, color: "var(--ft-text)", lineHeight: 1 }}
          >
            {sleepLabel.includes("h") ? (
              <>
                {sleepLabel.split("h")[0]}h
                <span style={{ fontSize: 16 }}>
                  {" "}
                  {sleepLabel.split("h")[1]?.trim() || ""}
                </span>
              </>
            ) : (
              sleepLabel
            )}
          </div>
          {hasPhases && (
            <>
              <div
                style={{
                  marginTop: 10,
                  height: 6,
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  gap: 1,
                }}
              >
                <div style={{ flex: deepSec, background: "#7C3AED" }} />
                <div style={{ flex: remSec, background: "var(--ft-accent)" }} />
                <div style={{ flex: lightSec, background: "var(--ft-sub)" }} />
              </div>
              <div
                className="flex gap-1.5 mt-1"
                style={{ fontSize: 9 }}
              >
                <span style={{ color: "#A78BFA" }}>Deep</span>
                <span style={{ color: "var(--ft-accent)" }}>REM</span>
                <span style={{ color: "var(--ft-sub)" }}>Light</span>
              </div>
            </>
          )}
          {sleepScore != null && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--ft-sub)" }}>
              Score{" "}
              <span
                style={{
                  color: sleepScore >= 75 ? "var(--ft-green)" : "var(--ft-amber)",
                  fontWeight: 600,
                }}
              >
                {sleepScore}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
