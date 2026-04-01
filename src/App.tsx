import { useState, useMemo } from 'react'
import type { AlignmentData, CheckResult, DesignSpeed, EmaxValue, RoadSurface, VehicleType } from './types/geometry'
import { parse12dHtml } from './parsers/parse12dHtml'
import { checkHorizontalAlignment } from './checks/horizontalAlignment'
import { checkVerticalAlignment } from './checks/verticalAlignment'
import { checkSuperelevation } from './checks/superelevation'
import { checkChainages } from './checks/chainages'
import { FileUpload } from './components/FileUpload'
import { DesignSpeedSelector } from './components/DesignSpeedSelector'
import { CheckSummary } from './components/CheckSummary'
import { IPMatrixTable } from './components/IPMatrixTable'
import { exportPdf } from './utils/exportPdf'

export default function App() {
  const [alignmentData, setAlignmentData] = useState<AlignmentData | null>(null)
  const [filename, setFilename] = useState('')
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [designSpeed, setDesignSpeed]     = useState<DesignSpeed>(100)
  const [emax, setEmax]                   = useState<EmaxValue>(6)
  const [vehicleTypes, setVehicleTypes]   = useState<VehicleType[]>(['LME'])
  const [roadSurface, setRoadSurface]     = useState<RoadSurface>('sealed')
  const [objectHeight, setObjectHeight]   = useState<number>(0)
  const [ipSpeedOverrides, setIpSpeedOverrides] = useState<Record<string, DesignSpeed>>({})

  function handleFile(content: string, name: string) {
    const data = parse12dHtml(content)
    setFilename(name)
    setAlignmentData(data)
    setParseWarnings(data.parseWarnings)
    setIpSpeedOverrides({})
    if (data.designSpeed) setDesignSpeed(data.designSpeed)
  }

  function handleReset() {
    setAlignmentData(null)
    setFilename('')
    setParseWarnings([])
    setIpSpeedOverrides({})
  }

  function handleSpeedOverride(ipId: string, overrideSpeed: DesignSpeed | null) {
    setIpSpeedOverrides(prev => {
      const next = { ...prev }
      if (overrideSpeed === null) delete next[ipId]
      else next[ipId] = overrideSpeed
      return next
    })
  }

  const allResults: CheckResult[] = useMemo(() => {
    if (!alignmentData) return []
    return [
      ...checkHorizontalAlignment(alignmentData, designSpeed, emax, ipSpeedOverrides),
      ...checkVerticalAlignment(alignmentData, designSpeed, emax, vehicleTypes, objectHeight, roadSurface, ipSpeedOverrides),
      ...checkSuperelevation(alignmentData, designSpeed, emax),
      ...checkChainages(alignmentData),
    ]
  }, [alignmentData, designSpeed, emax, vehicleTypes, objectHeight, roadSurface, ipSpeedOverrides])

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Road Geometry Checker 1.1</h1>
            <p className="text-xs text-blue-300 mt-0.5">
              Austroads AGRD Part 3 &amp; Main Roads WA Supplement
            </p>
          </div>
          {alignmentData && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">{alignmentData.name}</p>
                <p className="text-xs text-blue-300">{filename}</p>
              </div>
              <button
                onClick={() => exportPdf(alignmentData, allResults, designSpeed, emax)}
                className="rounded-lg bg-white text-blue-900 px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                New File
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        {/* Parse warnings */}
        {parseWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
            <p className="mb-1 font-semibold text-amber-800">Parser notices</p>
            <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-700">
              {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
            <p className="mt-2 text-xs text-amber-600">
              If data is missing, ensure the 12d report includes horizontal alignment, vertical
              alignment, and superelevation tables. Column headers must match standard 12d templates.
            </p>
          </div>
        )}

        {/* File upload or results */}
        {!alignmentData ? (
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-700">Upload 12d Report</h2>
            <p className="mb-6 text-sm text-slate-500">
              Export an HTML alignment report from 12d Model (File → Reports → Alignment Report → HTML).
              The file should contain horizontal alignment, vertical alignment, and optionally superelevation tables.
            </p>
            <FileUpload onFile={handleFile} />
          </div>
        ) : (
          <>
            {/* Settings */}
            <DesignSpeedSelector
              speed={designSpeed}
              emax={emax}
              vehicleTypes={vehicleTypes}
              roadSurface={roadSurface}
              objectHeight={objectHeight}
              onSpeedChange={setDesignSpeed}
              onEmaxChange={setEmax}
              onVehicleTypesChange={setVehicleTypes}
              onRoadSurfaceChange={setRoadSurface}
              onObjectHeightChange={setObjectHeight}
            />

            {/* Alignment info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoTile label="Horizontal IPs"  value={alignmentData.horizontalIPs.length} />
              <InfoTile label="Vertical IPs"    value={alignmentData.verticalIPs.length} />
              <InfoTile label="Super. Points"   value={alignmentData.superelevation.length} />
              <InfoTile
                label="Chainage Range"
                value={`${alignmentData.startChainage.toFixed(0)} – ${alignmentData.endChainage.toFixed(0)} m`}
              />
            </div>

            {/* Summary */}
            <CheckSummary results={allResults} />

            {/* IP matrix */}
            <IPMatrixTable
              data={alignmentData}
              results={allResults}
              speed={designSpeed}
              ipSpeedOverrides={ipSpeedOverrides}
              onSpeedOverride={handleSpeedOverride}
            />
          </>
        )}
      </main>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-700">{value}</p>
    </div>
  )
}
