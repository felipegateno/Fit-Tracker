import { formatShortDate } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

interface Props {
  chronological: InbodyMeasurement[]
}

export default function InbodyHistoryTable({ chronological }: Props) {
  const rows = [...chronological].reverse()

  return (
    <section className="px-3.5 space-y-2 pb-2">
      <details
        className="group rounded-2xl"
        style={{ border: "1px solid var(--ft-border)", background: "var(--ft-card)" }}
      >
        <summary
          className="cursor-pointer list-none px-4 py-3 flex items-center justify-between"
          style={{ fontSize: 13, fontWeight: 500, color: "var(--ft-sub2)" }}
        >
          Ver historial completo
          <span
            className="group-open:rotate-180 transition-transform"
            style={{ fontSize: 10, color: "var(--ft-sub)" }}
          >
            ▼
          </span>
        </summary>
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-left min-w-[420px]" style={{ fontSize: 12, color: "var(--ft-sub2)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ft-border)" }}>
                <th className="py-2 px-2 font-medium" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>Fecha</th>
                <th className="py-2 px-2 font-medium tabular-nums" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>Peso</th>
                <th className="py-2 px-2 font-medium tabular-nums" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>Músculo</th>
                <th className="py-2 px-2 font-medium tabular-nums" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>Grasa</th>
                <th className="py-2 px-2 font-medium tabular-nums" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>% Grasa</th>
                <th className="py-2 px-2 font-medium tabular-nums" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ft-sub)" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--ft-border)" }}
                  className="hover:bg-white/[0.03]"
                >
                  <td className="py-2 px-2 whitespace-nowrap" style={{ color: "var(--ft-text)" }}>{formatShortDate(r.fecha)}</td>
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
