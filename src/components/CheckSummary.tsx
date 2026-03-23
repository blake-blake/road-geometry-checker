import type { CheckResult } from '../types/geometry'

interface Props {
  results: CheckResult[]
}

export function CheckSummary({ results }: Props) {
  const pass    = results.filter(r => r.status === 'pass').length
  const fail    = results.filter(r => r.status === 'fail').length
  const warning = results.filter(r => r.status === 'warning').length
  const total   = results.length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard label="Total Checks" value={total} colour="slate" />
      <SummaryCard label="Pass"         value={pass}  colour="green" />
      <SummaryCard label="Fail"         value={fail}  colour="red" />
      <SummaryCard label="Warning"      value={warning} colour="amber" />
    </div>
  )
}

function SummaryCard({ label, value, colour }: { label: string; value: number; colour: string }) {
  const colours: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-800',
    red:   'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800',
  }
  return (
    <div className={`rounded-xl p-4 text-center ${colours[colour]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide">{label}</div>
    </div>
  )
}
