import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import { parseDashboardMode, resolveDashboardRange, type DateRangeResolved } from "@/lib/utils"
import { format, subDays } from "date-fns"
import DateSelector from "@/components/DateSelector"
import KpiGrid from "@/components/KpiGrid"
import MacroCard from "@/components/MacroCard"
import EnergyBalanceChart from "@/components/EnergyBalanceChart"
import StepsChart from "@/components/StepsChart"
import WorkoutCalendar from "@/components/WorkoutCalendar"
import HealthGrid from "@/components/HealthGrid"
import InbodyPanel from "@/components/InbodyPanel"
import MealLog from "@/components/MealLog"
import type {
  DailyTotals,
  DailyGoals,
  GarminDailyHealth,
  GarminSleep,
  GarminHrv,
  GarminTrainingReadiness,
  GarminActivity,
  DashboardDayPoint,
  DashboardMode,
  FoodLogEntry,
  InbodyMeasurement,
} from "@/types"

interface PageProps {
  searchParams: Promise<{ date?: string; mode?: string }>
}

export const dynamic = "force-dynamic"

/** Promedia solo dias que tengan datos reales (entry_count > 0). */
function averageDailyTotals(rows: (DailyTotals | undefined)[]): DailyTotals {
  const r = rows.filter(
    (x): x is DailyTotals => x != null && (x.entry_count ?? 0) > 0
  )
  if (r.length === 0) {
    return {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      entry_count: 0,
    }
  }
  const n = r.length
  return {
    total_calories: Math.round(r.reduce((s, x) => s + (x.total_calories ?? 0), 0) / n),
    total_protein: Math.round(r.reduce((s, x) => s + (x.total_protein ?? 0), 0) / n),
    total_carbs: Math.round(r.reduce((s, x) => s + (x.total_carbs ?? 0), 0) / n),
    total_fat: Math.round(r.reduce((s, x) => s + (x.total_fat ?? 0), 0) / n),
    entry_count: Math.round(r.reduce((s, x) => s + (x.entry_count ?? 0), 0) / n),
  }
}

async function fetchDashboardData(mode: DashboardMode, range: DateRangeResolved, userId: string) {
  const db = createServerClient()
  const { startDate, endDate, dayList, numDays } = range

  const foodLogPromise =
    mode === "daily"
      ? db
          .from("food_log")
          .select("raw_input, quantity_g, calories, meal_type, logged_at")
          .eq("user_id", userId)
          .gte("logged_at", endDate + "T00:00:00-04:00")
          .lte("logged_at", endDate + "T23:59:59.999-04:00")
          .order("logged_at", { ascending: true })
      : Promise.resolve({ data: [] as FoodLogEntry[] })

  const rpcForRange = () =>
    Promise.all(
      dayList.map((d) =>
        db.rpc("get_daily_totals", { p_user_id: userId, p_date: d })
      )
    )

  const monthPrefix = endDate.slice(0, 7)

  const healthRangePromise =
    numDays > 1
      ? db
          .from("garmin_daily_health")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true })
      : Promise.resolve({ data: [] as GarminDailyHealth[] })

  const [
    totalsRes,
    fiberRes,
    goalsRes,
    healthRes,
    sleepRes,
    hrvRes,
    readinessRes,
    healthRangeRes,
    healthChartRes,
    sleepRangeRes,
    totalsRangeResults,
    activitiesRes,
    foodLogRes,
  ] = await Promise.all([
    db.rpc("get_daily_totals", { p_user_id: userId, p_date: endDate }),
    db
      .from("food_log")
      .select("fiber_g")
      .eq("user_id", userId)
      .gte("logged_at", startDate)
      .lte("logged_at", endDate + "T23:59:59.999Z"),
    db
      .from("daily_goals")
      .select("*")
      .eq("user_id", userId)
      .lte("active_from", endDate)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("garmin_daily_health").select("*").eq("user_id", userId).eq("date", endDate).maybeSingle(),
    db.from("garmin_sleep").select("*").eq("user_id", userId).eq("date", endDate).maybeSingle(),
    db.from("garmin_hrv").select("*").eq("user_id", userId).eq("date", endDate).maybeSingle(),
    db.from("garmin_training_readiness").select("*").eq("user_id", userId).eq("date", endDate).maybeSingle(),
    healthRangePromise,
    db
      .from("garmin_daily_health")
      .select("date, total_steps, step_goal, active_calories, total_calories")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true }),
    db
      .from("garmin_sleep")
      .select("date, total_sleep_seconds, sleep_score")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true }),
    rpcForRange(),
    db
      .from("garmin_activities")
      .select(
        "id, user_id, activity_id, date, activity_type, name, duration_seconds, calories, distance_meters"
      )
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true }),
    foodLogPromise,
  ])

  const rpcRows = totalsRangeResults.map((r) => r.data?.[0] as DailyTotals | undefined)
  const displayTotals: DailyTotals =
    numDays > 1 ? averageDailyTotals(rpcRows) : (totalsRes.data?.[0] as DailyTotals | undefined) ?? {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      entry_count: 0,
    }

  const fiberSum = (fiberRes.data ?? []).reduce(
    (s: number, r: { fiber_g: number }) => s + (r.fiber_g ?? 0),
    0
  )
  const daysWithNutrition = rpcRows.filter(
    (x): x is DailyTotals => x != null && (x.entry_count ?? 0) > 0
  ).length
  const totalFiber = numDays > 1 && daysWithNutrition > 0
    ? fiberSum / daysWithNutrition
    : fiberSum

  const healthRows = (healthChartRes.data ?? []) as Array<{
    date: string
    total_steps?: number
    step_goal?: number
    total_calories?: number
  }>
  const sleepRows = (sleepRangeRes.data ?? []) as Array<{
    date: string
    total_sleep_seconds?: number
  }>

  const daySeries: DashboardDayPoint[] = dayList.map((d, i) => {
    const gh = healthRows.find((r) => r.date === d)
    const sl = sleepRows.find((r) => r.date === d)
    const row = totalsRangeResults[i]?.data?.[0]
    return {
      date: d,
      consumidas: Math.round(Number(row?.total_calories ?? 0)),
      quemadas: Math.round(Number(gh?.total_calories ?? 0)),
      total_steps: gh?.total_steps ?? 0,
      step_goal: gh?.step_goal ?? 9470,
      sleep_seconds: sl?.total_sleep_seconds ?? null,
    }
  })

  const healthRange = (healthRangeRes.data ?? []) as GarminDailyHealth[]

  return {
    totals: displayTotals,
    totalFiber,
    goals: goalsRes.data as DailyGoals | null,
    health: healthRes.data as GarminDailyHealth | null,
    sleep: sleepRes.data as GarminSleep | null,
    hrv: hrvRes.data as GarminHrv | null,
    readiness: readinessRes.data as GarminTrainingReadiness | null,
    healthRange,
    daySeries,
    activities: (activitiesRes.data ?? []) as GarminActivity[],
    calendarMonth: monthPrefix,
    foodLog: (foodLogRes.data ?? []) as FoodLogEntry[],
  }
}

async function fetchInbodyMeasurements(): Promise<InbodyMeasurement[]> {
  const db = createServerClient()
  const { data, error } = await db.from("inbody").select("*").order("fecha", { ascending: false })
  if (error) {
    console.error("inbody:", error.message)
    return []
  }
  return (data ?? []) as InbodyMeasurement[]
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("ft_userId")?.value

  if (!userId) {
    redirect("/select-user")
  }

  const params = await searchParams
  const mode = parseDashboardMode(params.mode)

  if (mode === "inbody") {
    const measurements = await fetchInbodyMeasurements()
    return (
      <div className="space-y-4 pt-2 pb-6">
        <InbodyPanel measurements={measurements} />
      </div>
    )
  }

  const anchorDate = params.date || format(new Date(), "yyyy-MM-dd")
  const range = resolveDashboardRange(anchorDate, mode)

  const data = await fetchDashboardData(mode, range, userId)

  const rangeLabel =
    mode === "weekly" ? "Promedio semanal" : mode === "monthly" ? "Promedio mensual" : null

  return (
    <>
      <Suspense
        fallback={
          <div
            className="h-12 border-b"
            style={{ borderColor: "var(--ft-border)", background: "var(--ft-nav)" }}
          />
        }
      >
        <DateSelector />
      </Suspense>
      <div className="space-y-4 pt-2 pb-6">
        <KpiGrid
          totals={data.totals}
          goals={data.goals}
          health={data.health}
          sleep={data.sleep}
          numDays={range.numDays}
          daySeries={data.daySeries}
          rangeLabel={rangeLabel}
        />

        <MacroCard totals={data.totals} totalFiber={data.totalFiber} goals={data.goals} />

        {mode === "daily" && <MealLog entries={data.foodLog} />}

        {mode !== "daily" && (
          <>
            <EnergyBalanceChart
              data={data.daySeries.map((d) => ({
                date: d.date,
                consumidas: d.consumidas,
                quemadas: d.quemadas,
              }))}
            />

            <StepsChart
              data={data.daySeries.map((d) => ({
                date: d.date,
                total_steps: d.total_steps,
                step_goal: d.step_goal,
              }))}
            />

            <WorkoutCalendar
              activities={data.activities}
              month={data.calendarMonth}
              weekMode={mode === "weekly"}
              weekRange={mode === "weekly" ? { start: range.startDate, end: range.endDate } : undefined}
            />
          </>
        )}

        <HealthGrid
          health={data.health}
          sleep={data.sleep}
          hrv={data.hrv}
          readiness={data.readiness}
          healthRange={data.healthRange}
          mode={mode}
        />
      </div>
    </>
  )
}
