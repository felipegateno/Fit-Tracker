import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { today } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") || today()

  const db = createServerClient()

  const [sleepRes, hrvRes, readinessRes] = await Promise.all([
    db.from("garmin_sleep").select("*").eq("date", date).maybeSingle(),
    db.from("garmin_hrv").select("*").eq("date", date).maybeSingle(),
    db.from("garmin_training_readiness").select("*").eq("date", date).maybeSingle(),
  ])

  return NextResponse.json({
    sleep: sleepRes.data ?? null,
    hrv: hrvRes.data ?? null,
    readiness: readinessRes.data ?? null,
  })
}
