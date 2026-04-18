import { formatDecimal, formatSignedDelta } from "@/lib/utils"
import type { InbodyMeasurement } from "@/types"

const C_MUSCLE = "#1D9E75"
const C_FAT = "#EF9F27"
const C_WATER = "#378ADD"
const C_OTHER = "#4b5563"

interface Props {
  latest: InbodyMeasurement
  prev: InbodyMeasurement | null
}

export default function BodyCompositionBar({ latest, prev }: Props) {
  const peso = latest.peso != null ? Number(latest.peso) : null
  const muscle = latest.masa_muscular != null ? Number(latest.masa_muscular) : 0
  const fat = latest.masa_grasa != null ? Number(latest.masa_grasa) : 0
  const waterL = latest.agua_corporal != null ? Number(latest.agua_corporal) : 0
  const waterKg = waterL

  if (peso == null || peso <= 0) {
    return (
      <section className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Composición vs peso</h2>
        <p className="text-sm text-gray-500">Sin dato de peso para calcular proporciones.</p>
      </section>
    )
  }

  const other = Math.max(0, peso - muscle - fat - waterKg)
  const totalParts = muscle + fat + waterKg + other
  const scale = totalParts > 0 ? peso / totalParts : 1
  const wMuscle = (muscle * scale) / peso
  const wFat = (fat * scale) / peso
  const wWater = (waterKg * scale) / peso
  const wOther = Math.max(0, 1 - wMuscle - wFat - wWater)

  const pct = (x: number) => Math.round(x * 1000) / 10

  let deltaLine: string | null = null
  if (prev && prev.peso != null && latest.masa_muscular != null && prev.masa_muscular != null &&
      latest.masa_grasa != null && prev.masa_grasa != null) {
    const dm = Number(latest.masa_muscular) - Number(prev.masa_muscular)
    const df = Number(latest.masa_grasa) - Number(prev.masa_grasa)
    deltaLine = `${formatSignedDelta(dm, "kg")} músculo · ${formatSignedDelta(df, "kg")} grasa`
  }

  return (
    <section className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Composición vs peso</h2>
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <span>
            <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ backgroundColor: C_MUSCLE }} />
            Músculo {pct(wMuscle)}%
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ backgroundColor: C_FAT }} />
            Grasa {pct(wFat)}%
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ backgroundColor: C_WATER }} />
            Agua {pct(wWater)}%
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ backgroundColor: C_OTHER }} />
            Otros {pct(wOther)}%
          </span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex w-full bg-gray-800">
          <div className="h-full" style={{ width: `${wMuscle * 100}%`, backgroundColor: C_MUSCLE }} />
          <div className="h-full" style={{ width: `${wFat * 100}%`, backgroundColor: C_FAT }} />
          <div className="h-full" style={{ width: `${wWater * 100}%`, backgroundColor: C_WATER }} />
          <div className="h-full" style={{ width: `${wOther * 100}%`, backgroundColor: C_OTHER }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Peso {formatDecimal(peso, 2)} kg</span>
          <span>Agua {formatDecimal(latest.agua_corporal, 2)} L</span>
        </div>
        {deltaLine && <p className="text-xs text-gray-500">vs anterior: {deltaLine}</p>}
      </div>
    </section>
  )
}
