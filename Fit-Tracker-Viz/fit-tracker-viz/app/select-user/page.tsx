import { createServerClient } from "@/lib/supabase"
import UserCards from "./UserCards"

export const dynamic = "force-dynamic"

export default async function SelectUserPage() {
  const db = createServerClient()
  const { data: users } = await db
    .from("users")
    .select("id, first_name, username")
    .order("first_name")

  return <UserCards users={users ?? []} />
}
