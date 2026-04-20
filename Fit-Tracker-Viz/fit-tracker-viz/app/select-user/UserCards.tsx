"use client"

import { useRouter } from "next/navigation"

const COLORS = ["#4F8EF7", "#22C55E", "#A78BFA", "#F59E0B", "#EF4444", "#EC4899"]

interface User {
  id: string
  first_name: string | null
  username: string | null
}

export default function UserCards({ users }: { users: User[] }) {
  const router = useRouter()

  const handleSelect = (user: User, index: number) => {
    const name = user.first_name ?? user.username ?? user.id
    const color = COLORS[index % COLORS.length]

    document.cookie = `ft_userId=${user.id}; path=/; max-age=31536000; SameSite=Lax`

    try {
      localStorage.setItem(
        "ft_user",
        JSON.stringify({ id: user.id, name, initials: name[0].toUpperCase(), color })
      )
    } catch {
      // ignore
    }

    router.push("/")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "var(--ft-bg)" }}
    >
      <div className="mb-10 text-center">
        <div
          className="flex items-center justify-center rounded-3xl mx-auto mb-4 text-3xl"
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg, #4F8EF7, #7C3AED)",
            boxShadow: "0 16px 40px #4F8EF744",
          }}
        >
          ⚡
        </div>
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: 28, color: "var(--ft-text)", letterSpacing: "-0.02em" }}
        >
          Fit Tracker
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--ft-sub)" }}>
          ¿Quién eres hoy?
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {users.map((u, i) => {
          const name = u.first_name ?? u.username ?? u.id
          const color = COLORS[i % COLORS.length]
          return (
            <button
              key={u.id}
              onClick={() => handleSelect(u, i)}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-all"
              style={{
                background: "var(--ft-card)",
                border: "1px solid var(--ft-border)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--ft-border)"
              }}
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 text-lg font-bold"
                style={{
                  width: 48,
                  height: 48,
                  background: `${color}18`,
                  border: `2px solid ${color}55`,
                  color,
                }}
              >
                {name[0].toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-base" style={{ color: "var(--ft-text)" }}>
                  {name}
                </div>
              </div>

              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="var(--ft-sub)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
