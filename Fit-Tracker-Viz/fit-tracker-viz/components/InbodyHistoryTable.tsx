import { formatShortDate } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

interface Props {
  chronological: InbodyMeasurement[]
}

export default function InbodyHistoryTable({ chronological }: Props) {
  const rows = [...chronological].reverse()

  return (
    <section className="px-4 space-y-2 pb-2">
      <details className="group rounded-xl border border-gray-800 bg-gray-900/50">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-300 flex items-center justify-between">
          Ver historial completo
          <span className="text-gray-500 group-open:rotate-180 transition-transform text-xs">▼</span>
        </summary>
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-left text-xs text-gray-400 min-w-[420px]">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase tracking-wide text-gray-500">
                <th className="py-2 px-2 font-medium">Fecha</th>
                <th className="py-2 px-2 font-medium tabular-nums">Peso</th>
                <th className="py-2 px-2 font-medium tabular-nums">Músculo</th>
                <th className="py-2 px-2 font-medium tabular-nums">Grasa</th>
                <th className="py-2 px-2 font-medium tabular-nums">% Grasa</th>
                <th className="py-2 px-2 font-medium tabular-nums">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/80 hover:bg-gray-800/40">
                  <td className="py-2 px-2 text-gray-300 whitespace-nowrap">{formatShortDate(r.fecha)}</td>
                  <td className="py-2 px-2 tabular-nums">{r.peso ?? "—"}</td>
                  <td className="py-2 px-2 tabular-nums">{r.masa_muscular ?? "—"}</td>
                  <td className="py-2 px-2 tabular-nums">{r.masa_grasa ?? "—"}</td>
                  <td className="py-2 px-2 tabular-nums">{r.porcentaje_grasa ?? "—"}</td>
                  <td className="py-2 px-2 tabular-nums">{r.puntuacion_inbody ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
