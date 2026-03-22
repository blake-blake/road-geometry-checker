import type { DesignSpeed, Standard } from '../types/geometry'

interface Props {
  speed: DesignSpeed
  standard: Standard
  onSpeedChange: (s: DesignSpeed) => void
  onStandardChange: (s: Standard) => void
}

const SPEEDS: DesignSpeed[] = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]

export function DesignSpeedSelector({ speed, standard, onSpeedChange, onStandardChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Design Speed
        </label>
        <div className="flex gap-2 flex-wrap">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s} km/h
            </button>
          ))}
        </div>
      </div>

      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Design Standard
        </label>
        <div className="flex gap-2">
          {(['austroads', 'mainroads_wa'] as Standard[]).map(std => (
            <button
              key={std}
              onClick={() => onStandardChange(std)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                standard === std
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {std === 'austroads' ? 'Austroads (emax=7%)' : 'MRWA (emax=10%)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
