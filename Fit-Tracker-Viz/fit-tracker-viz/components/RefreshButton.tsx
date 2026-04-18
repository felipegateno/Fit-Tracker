"use client"

import { RotateCw } from "lucide-react"

interface Props {
  isPending: boolean
  onClick: () => void
}

export default function RefreshButton({ isPending, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      aria-label="Actualizar datos desde Supabase"
      title="Actualizar"
    >
      <RotateCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
    </button>
  )
}
