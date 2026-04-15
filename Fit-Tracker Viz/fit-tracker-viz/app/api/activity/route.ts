import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { today } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") || today()
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : null
  const type = searchParams.get("type") // "steps" | "activities" | "calendar"

  const db = createServerClient()

  if (type === "calendar") {
    // Full month for calendar view
    const month = date.slice(0, 7)
    const { data, error } = await db
      .from("garmin_activities")
      .select("date, activity_type, name, duration_seconds, calories")
      .gte("date", month + "-01")
      .lte("date", month + "-31")
      .order("date", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  if (days) {
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - days + 1)
    const startISO = startDate.toISOString().split("T")[0]

    const { data, error } = await db
      .from("garmin_daily_health")
      .select("date, total_steps, step_goal, active_calories, total_calories, resting_hr, avg_stress, body_battery_highest, body_battery_lowest")
      .gte("date", startISO)
      .lte("date", date)
      .order("date", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Single day
  const { data, error } = await db
    .from("garmin_daily_health")
    .select("*")
    .eq("date", date)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? null)
}
