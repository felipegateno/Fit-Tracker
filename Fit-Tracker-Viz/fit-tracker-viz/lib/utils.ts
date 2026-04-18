import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  format,
  subDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import type { DashboardMode } from "@/types"

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

/** dd/MM/yyyy para UI */
export function formatShortDate(iso: string): string {
  return format(parseISO(iso + "T12:00:00"), "dd/MM/yyyy", { locale: es })
}

export function today(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/** Ultimos N dias terminando en `from` (inclusive), orden ascendente. */
export function lastNDays(n: number, from: string): string[] {
  const base = parseISO(from + "T12:00:00")
  return Array.from({ length: n }, (_, i) =>
    format(subDays(base, n - 1 - i), "yyyy-MM-dd")
  )
}

export function parseDashboardMode(raw: string | null | undefined): DashboardMode {
  if (raw === "weekly" || raw === "monthly" || raw === "inbody") return raw
  return "daily"
}

/** Ultimo dia valido del mes YYYY-MM (evita -31 en meses cortos). */
export function lastDayOfMonthISO(monthPrefix: string): string {
  return format(endOfMonth(parseISO(monthPrefix + "-01")), "yyyy-MM-dd")
}

export type DateRangeResolved = {
  startDate: string
  endDate: string
  numDays: number
  dayList: string[]
}

export function resolveDashboardRange(anchor: string, mode: DashboardMode): DateRangeResolved {
  if (mode === "inbody") {
    return {
      startDate: anchor,
      endDate: anchor,
      numDays: 0,
      dayList: [],
    }
  }
  const base = parseISO(anchor + "T12:00:00")
  if (mode === "daily") {
    return {
      startDate: anchor,
      endDate: anchor,
      numDays: 1,
      dayList: [anchor],
    }
  }
  if (mode === "weekly") {
    const ws = startOfWeek(base, { weekStartsOn: 1 })
    const we = endOfWeek(base, { weekStartsOn: 1 })
    const startDate = format(ws, "yyyy-MM-dd")
    const endDate = format(we, "yyyy-MM-dd")
    const dayList = eachDayOfInterval({ start: ws, end: we }).map((d) => format(d, "yyyy-MM-dd"))
    return { startDate, endDate, numDays: 7, dayList }
  }
  const ms = startOfMonth(base)
  const me = endOfMonth(base)
  const startDate = format(ms, "yyyy-MM-dd")
  const endDate = format(me, "yyyy-MM-dd")
  const dayList = eachDayOfInterval({ start: ms, end: me }).map((d) => format(d, "yyyy-MM-dd"))
  return { startDate, endDate, numDays: dayList.length, dayList }
}

export function secondsToHM(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}

/** Duracion larga en horas con decimales utiles (gimnasio). */
export function secondsToHoursLabel(s: number): string {
  const h = s / 3600
  if (h >= 1) return `${h.toFixed(1).replace(".", ",")} h`
  const m = Math.round(s / 60)
  return `${m} min`
}

/** Número con decimales para UI (es-CL). */
export function formatDecimal(n: number | null | undefined, decimals = 2): string {
  if (n == null || Number.isNaN(n)) return "—"
  return n.toLocaleString("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export type InbodyDeltaTone = "good" | "bad" | "neutral"

/** Clasifica si un delta en una métrica es favorable, desfavorable o neutro. */
export function inbodyDeltaTone(field: string, delta: number, epsilon = 0.05): InbodyDeltaTone {
  if (Math.abs(delta) < epsilon) return "neutral"
  if (field === "peso") return "neutral"
  const higherBetter =
    field.startsWith("musculo_") ||
    field === "masa_muscular" ||
    field === "agua_corporal" ||
    field === "tmb" ||
    field === "puntuacion_inbody"
  const lowerBetter =
    field.startsWith("grasa_") ||
    field === "masa_grasa" ||
    field === "porcentaje_grasa" ||
    field === "grasa_visceral"
  const up = delta > 0
  if (higherBetter) return up ? "good" : "bad"
  if (lowerBetter) return up ? "bad" : "good"
  return "neutral"
}

export function inbodyDeltaColor(tone: InbodyDeltaTone): string {
  if (tone === "good") return "#1D9E75"
  if (tone === "bad") return "#f87171"
  return "#9ca3af"
}

/** Formato con signo para deltas (ej. "+0,40 kg"). */
export function formatSignedDelta(n: number, unit = ""): string {
  const abs = Math.abs(n).toLocaleString("es-CL", { maximumFractionDigits: 2 })
  const sign = n > 0 ? "+" : n < 0 ? "−" : ""
  return `${sign}${abs}${unit ? ` ${unit}` : ""}`
}
