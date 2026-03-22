import type { CheckResult, CheckCategory } from '../types/geometry'

interface Props {
  results: CheckResult[]
  activeCategory: CheckCategory | 'All'
  onCategoryChange: (c: CheckCategory | 'All') => void
  activeStatus: string
  onStatusChange: (s: string) => void
}

const CATEGORIES: (CheckCategory | 'All')[] = [
  'All', 'Horizontal Alignment', 'Vertical Alignment', 'Superelevation', 'Chainages',
]

export function CheckSummary({ results, activeCategory, onCategoryChange, activeStatus, onStatusChange }: Props) {
  const pass    = results.filter(r => r.status === 'pass').length
  const fail    = results.filter(r => r.status === 'fail').length
  const warning = results.filter(r => r.status === 'warning').length
  const total   = results.length

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Checks" value={total} colour="slate" />
        <SummaryCard label="Pass" value={pass} colour="green" />
        <SummaryCard label="Fail" value={fail} colour="red" />
        <SummaryCard label="Warning" value={warning} colour="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {['All', 'pass', 'fail', 'warning'].map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                activeStatus === s
                  ? statusBg(s) + ' text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
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

function statusBg(status: string) {
  if (status === 'pass')    return 'bg-green-600'
  if (status === 'fail')    return 'bg-red-600'
  if (status === 'warning') return 'bg-amber-500'
  return 'bg-slate-600'
}
