import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Browser client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client with service role (for API routes only — never expose to client)
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

// NutriBot user ID (Telegram)
export const NUTRIBOT_USER_ID = "8254792740"
