import type { DesignSpeed, EmaxValue, RoadSurface, VehicleType } from '../types/geometry'
import { VEHICLE_PARAMS } from '../standards/austroads'
import { UNSEALED_EXCLUDED_VEHICLES, SEALED_EXCLUDED_VEHICLES } from '../standards/unsealed'

interface Props {
  speed: DesignSpeed
  emax: EmaxValue
  vehicleTypes: VehicleType[]
  roadSurface: RoadSurface
  objectHeight: number
  onSpeedChange: (s: DesignSpeed) => void
  onEmaxChange: (e: EmaxValue) => void
  onVehicleTypesChange: (vt: VehicleType[]) => void
  onRoadSurfaceChange: (s: RoadSurface) => void
  onObjectHeightChange: (h: number) => void
}

const SPEEDS: DesignSpeed[] = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
const ALL_VEHICLE_TYPES: VehicleType[] = ['LME', 'Truck', 'RAV4S', 'HME']
const EMAX_OPTIONS: EmaxValue[] = [6, 7, 10]

export function DesignSpeedSelector({
  speed, emax, vehicleTypes, roadSurface, objectHeight,
  onSpeedChange, onEmaxChange, onVehicleTypesChange, onRoadSurfaceChange, onObjectHeightChange,
}: Props) {

  function toggleVehicleType(vt: VehicleType) {
    if (vehicleTypes.includes(vt)) {
      if (vehicleTypes.length === 1) return
      onVehicleTypesChange(vehicleTypes.filter(v => v !== vt))
    } else {
      onVehicleTypesChange([...vehicleTypes, vt])
    }
  }

  function handleRoadSurfaceChange(surface: RoadSurface) {
    onRoadSurfaceChange(surface)
    // Remove vehicle types that don't apply to the new surface
    const excluded = surface === 'unsealed'
      ? (UNSEALED_EXCLUDED_VEHICLES as readonly string[])
      : (SEALED_EXCLUDED_VEHICLES as readonly string[])
    const filtered = vehicleTypes.filter(vt => !excluded.includes(vt))
    onVehicleTypesChange(filtered.length > 0 ? filtered : ['LME'])
  }

  const disabledForSurface = (vt: VehicleType): boolean => {
    if (roadSurface === 'unsealed') return (UNSEALED_EXCLUDED_VEHICLES as readonly string[]).includes(vt)
    return (SEALED_EXCLUDED_VEHICLES as readonly string[]).includes(vt)
  }

  return (
    <div className="flex flex-wrap items-start gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      {/* Design speed */}
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

      {/* emax */}
      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          emax
        </label>
        <div className="flex gap-2">
          {EMAX_OPTIONS.map(e => (
            <button
              key={e}
              onClick={() => onEmaxChange(e)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                emax === e
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {e}%{e === 10 ? ' (MRWA)' : e === 7 ? ' (Austroads)' : ' (Mine)'}
            </button>
          ))}
        </div>
      </div>

      {/* Road surface */}
      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Road Surface
        </label>
        <div className="flex gap-2">
          {(['sealed', 'unsealed'] as RoadSurface[]).map(surface => (
            <button
              key={surface}
              onClick={() => handleRoadSurfaceChange(surface)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                roadSurface === surface
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {surface === 'sealed' ? 'Sealed' : 'Unsealed'}
            </button>
          ))}
        </div>
      </div>

      {/* Object height */}
      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Object Height (h₂)
        </label>
        <div className="flex gap-2">
          {([0.2, 0.0] as number[]).map(h => (
            <button
              key={h}
              onClick={() => onObjectHeightChange(h)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                objectHeight === h
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {h === 0.2 ? 'h₂ = 0.2 m' : 'h₂ = 0 m'}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Affects crest K values only.
        </p>
      </div>

      {/* Vehicle types */}
      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Vehicle Types
        </label>
        <div className="flex gap-3 flex-wrap">
          {ALL_VEHICLE_TYPES.map(vt => {
            const selected = vehicleTypes.includes(vt)
            const disabled = disabledForSurface(vt)
            return (
              <label
                key={vt}
                className={`flex items-center gap-1.5 select-none ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                title={disabled ? `${VEHICLE_PARAMS[vt].label} is not applicable to ${roadSurface} roads` : undefined}
              >
                <input
                  type="checkbox"
                  checked={selected && !disabled}
                  disabled={disabled}
                  onChange={() => !disabled && toggleVehicleType(vt)}
                  className="accent-blue-600"
                />
                <span className={`text-sm font-semibold ${selected && !disabled ? 'text-slate-800' : 'text-slate-400'}`}>
                  {VEHICLE_PARAMS[vt].label}
                </span>
              </label>
            )
          })}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Affects crest K values. At least one must be selected.
        </p>
      </div>
    </div>
  )
}
