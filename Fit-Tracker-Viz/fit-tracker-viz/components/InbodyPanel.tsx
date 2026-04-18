import BodyCompositionBar from "@/components/BodyCompositionBar"
import InbodyHistoryTable from "@/components/InbodyHistoryTable"
import InbodyKpiGrid from "@/components/InbodyKpiGrid"
import InbodyMetabolicGrid from "@/components/InbodyMetabolicGrid"
import InbodyScoreCard from "@/components/InbodyScoreCard"
import SegmentalBalance from "@/components/SegmentalBalance"
import { formatShortDate } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

interface Props {
  measurements: InbodyMeasurement[]
}

function byFechaAsc(a: InbodyMeasurement, b: InbodyMeasurement) {
  return a.fecha.localeCompare(b.fecha)
}

export default function InbodyPanel({ measurements }: Props) {
  const chronological = [...measurements].sort(byFechaAsc)
  const latest = chronological[chronological.length - 1] ?? null
  const prev = chronological.length >= 2 ? chronological[chronological.length - 2] : null
  const first = chronological[0] ?? null

  if (!latest || !first) {
    return (
      <div className="px-4 pt-6 pb-10">
        <p className="text-sm text-gray-400">No hay mediciones InBody. Agrega filas en Supabase (tabla `inbody`).</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <header className="px-4">
        <p className="text-xs text-gray-500">
          {formatShortDate(first.fecha)} — {formatShortDate(latest.fecha)} · {chronological.length}{" "}
          {chronological.length === 1 ? "medición" : "mediciones"}
        </p>
      </header>

      <InbodyKpiGrid chronological={chronological} />
      <InbodyScoreCard latest={latest} prev={prev} />
      <BodyCompositionBar latest={latest} prev={prev} />
      <SegmentalBalance chronological={chronological} />
      <InbodyMetabolicGrid chronological={chronological} />
      <InbodyHistoryTable chronological={chronological} />
    </div>
  )
}
