"use client"

import { useRouter } from "next/navigation"

const USERS = [
  { id: "fede", name: "Fede", initials: "F", color: "#4F8EF7" },
  { id: "carlos", name: "Carlos", initials: "C", color: "#22C55E" },
  { id: "ana", name: "Ana", initials: "A", color: "#A78BFA" },
]

export default function SelectUserPage() {
  const router = useRouter()

  const handleSelect = (user: (typeof USERS)[0]) => {
    try {
      localStorage.setItem("ft_user", JSON.stringify(user))
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
      {/* Logo */}
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

      {/* User cards */}
      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {USERS.map((u) => (
          <button
            key={u.id}
            onClick={() => handleSelect(u)}
            className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-all"
            style={{
              background: "var(--ft-card)",
              border: "1px solid var(--ft-border)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = u.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--ft-border)"
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 text-lg font-bold"
              style={{
                width: 48,
                height: 48,
                background: `${u.color}18`,
                border: `2px solid ${u.color}55`,
                color: u.color,
              }}
            >
              {u.initials}
            </div>

            {/* Name */}
            <div className="flex-1">
              <div className="font-semibold text-base" style={{ color: "var(--ft-text)" }}>
                {u.name}
              </div>
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="var(--ft-sub)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
