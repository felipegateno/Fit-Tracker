import { createServerClient, NUTRIBOT_USER_ID } from "@/lib/supabase"
import { lastNDays, parseNumDays } from "@/lib/utils"
import { format, subDays } from "date-fns"
import KpiGrid from "@/components/KpiGrid"
import MacroCard from "@/components/MacroCard"
import EnergyBalanceChart from "@/components/EnergyBalanceChart"
import StepsChart from "@/components/StepsChart"
import WorkoutCalendar from "@/components/WorkoutCalendar"
import HealthGrid from "@/components/HealthGrid"
import type {
  DailyTotals,
  DailyGoals,
  GarminDailyHealth,
  GarminSleep,
  GarminHrv,
  GarminTrainingReadiness,
  GarminActivity,
  DashboardDayPoint,
} from "@/types"

interface PageProps {
  searchParams: Promise<{ date?: string; days?: string }>
}

export const revalidate = 300

async function fetchDashboardData(date: string, numDays: number) {
  const db = createServerClient()
  const dayList = lastNDays(numDays, date)
  const rangeStart = dayList[0]!
  const rangeEnd = dayList[dayList.length - 1]!
  const monthPrefix = date.slice(0, 7)

  const rpcForRange = () =>
    Promise.all(
      dayList.map((d) =>
        db.rpc("get_daily_totals", { p_user_id: NUTRIBOT_USER_ID, p_date: d })
      )
    )

  const [
    totalsRes,
    fiberRes,
    goalsRes,
    healthRes,
    sleepRes,
    hrvRes,
    readinessRes,
    healthRangeRes,
    sleepRangeRes,
    totalsRangeResults,
    activitiesRes,
  ] = await Promise.all([
    db.rpc("get_daily_totals", { p_user_id: NUTRIBOT_USER_ID, p_date: date }),
    db
      .from("food_log")
      .select("fiber_g")
      .eq("user_id", NUTRIBOT_USER_ID)
      .gte("logged_at", date)
      .lte("logged_at", date + "T23:59:59.999Z"),
    db
      .from("daily_goals")
      .select("*")
      .eq("user_id", NUTRIBOT_USER_ID)
      .lte("active_from", date)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("garmin_daily_health").select("*").eq("date", date).maybeSingle(),
    db.from("garmin_sleep").select("*").eq("date", date).maybeSingle(),
    db.from("garmin_hrv").select("*").eq("date", date).maybeSingle(),
    db.from("garmin_training_readiness").select("*").eq("date", date).maybeSingle(),
    db
      .from("garmin_daily_health")
      .select("date, total_steps, step_goal, active_calories, total_calories")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: true }),
    db
      .from("garmin_sleep")
      .select("date, total_sleep_seconds, sleep_score")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: true }),
    rpcForRange(),
    db
      .from("garmin_activities")
      .select("id, user_id, activity_id, date, activity_type, name, duration_seconds, calories")
      .gte("date", monthPrefix + "-01")
      .lte("date", monthPrefix + "-31")
      .order("date", { ascending: true }),
  ])

  const rpcData = totalsRes.data?.[0]
  const totals: DailyTotals = rpcData ?? {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    entry_count: 0,
  }

  const totalFiber = (fiberRes.data ?? []).reduce(
    (s: number, r: { fiber_g: number }) => s + (r.fiber_g ?? 0),
    0
  )

  const healthRows = (healthRangeRes.data ?? []) as Array<{
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

  return {
    totals,
    totalFiber,
    goals: goalsRes.data as DailyGoals | null,
    health: healthRes.data as GarminDailyHealth | null,
    sleep: sleepRes.data as GarminSleep | null,
    hrv: hrvRes.data as GarminHrv | null,
    readiness: readinessRes.data as GarminTrainingReadiness | null,
    daySeries,
    activities: (activitiesRes.data ?? []) as GarminActivity[],
  }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const date = params.date || format(subDays(new Date(), 1), "yyyy-MM-dd")
  const numDays = parseNumDays(params.days)
  const month = date.slice(0, 7)

  const data = await fetchDashboardData(date, numDays)

  return (
    <div className="space-y-6 pt-2">
      <KpiGrid
        totals={data.totals}
        goals={data.goals}
        health={data.health}
        sleep={data.sleep}
        numDays={numDays}
        daySeries={data.daySeries}
      />

      <MacroCard
        totals={data.totals}
        totalFiber={data.totalFiber}
        goals={data.goals}
      />

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

      <WorkoutCalendar activities={data.activities} month={month} />

      <HealthGrid
        health={data.health}
        sleep={data.sleep}
        hrv={data.hrv}
        readiness={data.readiness}
      />
    </div>
  )
}
