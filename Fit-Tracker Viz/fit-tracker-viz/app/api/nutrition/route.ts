import { NextRequest, NextResponse } from "next/server"
import { createServerClient, NUTRIBOT_USER_ID } from "@/lib/supabase"
import { today } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") || today()
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : null

  const db = createServerClient()

  if (days) {
    // Return aggregate per day for last N days
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - days + 1)
    const startISO = startDate.toISOString().split("T")[0]

    const { data, error } = await db
      .from("food_log")
      .select("logged_at, calories, protein_g, carbs_g, fat_g, fiber_g")
      .eq("user_id", NUTRIBOT_USER_ID)
      .gte("logged_at", startISO)
      .lte("logged_at", date + "T23:59:59.999Z")
      .order("logged_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by date
    const byDate: Record<string, { date: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }> = {}
    for (const row of data ?? []) {
      const d = row.logged_at.split("T")[0]
      if (!byDate[d]) byDate[d] = { date: d, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      byDate[d].calories += row.calories ?? 0
      byDate[d].protein += row.protein_g ?? 0
      byDate[d].carbs += row.carbs_g ?? 0
      byDate[d].fat += row.fat_g ?? 0
      byDate[d].fiber += row.fiber_g ?? 0
    }

    return NextResponse.json(Object.values(byDate))
  }

  // Single day totals via RPC
  const { data: totals, error: totalsError } = await db.rpc("get_daily_totals", {
    p_user_id: NUTRIBOT_USER_ID,
    p_date: date,
  })
  if (totalsError) return NextResponse.json({ error: totalsError.message }, { status: 500 })

  // Also get fiber (not in RPC)
  const { data: fiberData } = await db
    .from("food_log")
    .select("fiber_g")
    .eq("user_id", NUTRIBOT_USER_ID)
    .gte("logged_at", date)
    .lte("logged_at", date + "T23:59:59.999Z")

  const total_fiber = (fiberData ?? []).reduce((sum, r) => sum + (r.fiber_g ?? 0), 0)

  // Get goals
  const { data: goals } = await db
    .from("daily_goals")
    .select("*")
    .eq("user_id", NUTRIBOT_USER_ID)
    .lte("active_from", date)
    .order("active_from", { ascending: false })
    .limit(1)
    .single()

  const t = totals?.[0] ?? { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, entry_count: 0 }

  return NextResponse.json({
    date,
    totals: { ...t, total_fiber },
    goals: goals ?? null,
  })
}
