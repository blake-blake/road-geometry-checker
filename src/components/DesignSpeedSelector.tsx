import type { DesignSpeed, Standard, VehicleType } from '../types/geometry'
import { VEHICLE_PARAMS } from '../standards/austroads'

interface Props {
  speed: DesignSpeed
  standard: Standard
  vehicleTypes: VehicleType[]
  onSpeedChange: (s: DesignSpeed) => void
  onStandardChange: (s: Standard) => void
  onVehicleTypesChange: (vt: VehicleType[]) => void
}

const SPEEDS: DesignSpeed[] = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
const ALL_VEHICLE_TYPES: VehicleType[] = ['LME', 'Truck', 'RAV4S', 'HME']

export function DesignSpeedSelector({
  speed, standard, vehicleTypes,
  onSpeedChange, onStandardChange, onVehicleTypesChange,
}: Props) {

  function toggleVehicleType(vt: VehicleType) {
    if (vehicleTypes.includes(vt)) {
      // Don't allow deselecting the last type
      if (vehicleTypes.length === 1) return
      onVehicleTypesChange(vehicleTypes.filter(v => v !== vt))
    } else {
      onVehicleTypesChange([...vehicleTypes, vt])
    }
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

      {/* Standard */}
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

      {/* Vehicle types */}
      <div className="border-l border-slate-200 pl-6">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Vehicle Types
        </label>
        <div className="flex gap-3 flex-wrap">
          {ALL_VEHICLE_TYPES.map(vt => {
            const selected = vehicleTypes.includes(vt)
            return (
              <label
                key={vt}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleVehicleType(vt)}
                  className="accent-blue-600"
                />
                <span className={`text-sm font-semibold ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
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
