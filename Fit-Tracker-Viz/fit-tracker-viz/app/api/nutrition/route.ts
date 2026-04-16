import { NextRequest, NextResponse } from "next/server"
import { createServerClient, NUTRIBOT_USER_ID } from "@/lib/supabase"
import { today } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") || today()
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : null

  const db = createServerClient()

  // --- CASO 1: GRÁFICO DE N DÍAS ---
  if (days) {
    const dateList: string[] = []
    const baseDate = new Date(date + "T12:00:00") // Usamos mediodía para evitar saltos de día por zona horaria en JS

    // Generamos la lista de fechas hacia atrás
    for (let i = 0; i < days; i++) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() - i)
      dateList.push(d.toISOString().split("T")[0])
    }

    // Ejecutamos el RPC para cada día en paralelo para asegurar consistencia total
    const results = await Promise.all(
      dateList.reverse().map(async (d) => {
        // 1. Obtener totales del RPC
        const { data: totals } = await db.rpc("get_daily_totals", {
          p_user_id: NUTRIBOT_USER_ID,
          p_date: d,
        })

        // 2. Obtener fibra (ya que el RPC no la incluye)
        const { data: fiberData } = await db
          .from("food_log")
          .select("fiber_g")
          .eq("user_id", NUTRIBOT_USER_ID)
          .gte("logged_at", d)
          .lte("logged_at", d + "T23:59:59.999Z")

        const total_fiber = (fiberData ?? []).reduce((sum, r) => sum + (r.fiber_g ?? 0), 0)
        const t = totals?.[0] ?? { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }

        return {
          date: d,
          calories: t.total_calories || 0,
          protein: t.total_protein || 0,
          carbs: t.total_carbs || 0,
          fat: t.total_fat || 0,
          fiber: total_fiber,
        }
      })
    )

    return NextResponse.json(results)
  }

  // --- CASO 2: TARJETA DEL DÍA (LÓGICA ORIGINAL) ---
  const { data: totals, error: totalsError } = await db.rpc("get_daily_totals", {
    p_user_id: NUTRIBOT_USER_ID,
    p_date: date,
  })
  
  if (totalsError) return NextResponse.json({ error: totalsError.message }, { status: 500 })

  const { data: fiberData } = await db
    .from("food_log")
    .select("fiber_g")
    .eq("user_id", NUTRIBOT_USER_ID)
    .gte("logged_at", date)
    .lte("logged_at", date + "T23:59:59.999Z")

  const total_fiber = (fiberData ?? []).reduce((sum, r) => sum + (r.fiber_g ?? 0), 0)

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
