import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, subDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNum(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—"
  return Math.round(n).toLocaleString("es-CL")
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd MMM", { locale: es })
}

export function today(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subDays(new Date(), n - 1 - i), "yyyy-MM-dd")
  )
}

export function secondsToHM(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}
