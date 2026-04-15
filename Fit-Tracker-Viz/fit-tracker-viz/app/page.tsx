import { Suspense } from "react"
import { createServerClient, NUTRIBOT_USER_ID } from "@/lib/supabase"
import { today, lastNDays } from "@/lib/utils"
import { format, subDays } from "date-fns"
import DateBar from "@/components/DateBar"
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
} from "@/types"

interface PageProps {
  searchParams: Promise<{ date?: string; days?: string }>
}

async function fetchDashboardData(date: string) {
  const db = createServerClient()

  const [
    totalsRes,
    fiberRes,
    goalsRes,
    healthRes,
    sleepRes,
    hrvRes,
    readinessRes,
    health7Res,
    nutr7Res,
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
      .gte("date", format(subDays(new Date(date), 6), "yyyy-MM-dd"))
      .lte("date", date)
      .order("date", { ascending: true }),
    db
      .from("food_log")
      .select("logged_at, calories, fiber_g")
      .eq("user_id", NUTRIBOT_USER_ID)
      .gte("logged_at", format(subDays(new Date(date), 6), "yyyy-MM-dd"))
      .lte("logged_at", date + "T23:59:59.999Z")
      .order("logged_at", { ascending: true }),
    db
      .from("garmin_activities")
      .select("id, user_id, activity_id, date, activity_type, name, duration_seconds, calories")
      .gte("date", format(new Date(), "yyyy-MM") + "-01")
      .lte("date", format(new Date(), "yyyy-MM") + "-31")
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

  const nutrByDate: Record<string, number> = {}
  for (const row of nutr7Res.data ?? []) {
    const d = row.logged_at.split("T")[0]
    nutrByDate[d] = (nutrByDate[d] ?? 0) + (row.calories ?? 0)
  }

  const days7 = lastNDays(7).map((d) => {
    const gh = (health7Res.data ?? []).find(
      (r: { date: string }) => r.date === d
    )
    return {
      date: d,
      consumidas: Math.round(nutrByDate[d] ?? 0),
      quemadas: Math.round((gh as { total_calories?: number } | undefined)?.total_calories ?? 0),
      total_steps: (gh as { total_steps?: number } | undefined)?.total_steps ?? 0,
      step_goal: (gh as { step_goal?: number } | undefined)?.step_goal ?? 9470,
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
    days7,
    activities: (activitiesRes.data ?? []) as GarminActivity[],
  }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const date = params.date || format(subDays(new Date(), 1), "yyyy-MM-dd")
  const month = format(new Date(), "yyyy-MM")

  const data = await fetchDashboardData(date)

  return (
    <div className="space-y-6 pt-2">
      <Suspense>
        <DateBar />
      </Suspense>

      <KpiGrid
        totals={data.totals}
        goals={data.goals}
        health={data.health}
        sleep={data.sleep}
      />

      <MacroCard
        totals={data.totals}
        totalFiber={data.totalFiber}
        goals={data.goals}
      />

      <EnergyBalanceChart
        data={data.days7.map((d) => ({
          date: d.date,
          consumidas: d.consumidas,
          quemadas: d.quemadas,
        }))}
      />

      <StepsChart
        data={data.days7.map((d) => ({
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
