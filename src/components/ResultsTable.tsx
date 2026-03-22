import type { CheckResult, CheckStatus } from '../types/geometry'

interface Props {
  results: CheckResult[]
}

export function ResultsTable({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
        No results match the current filter.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 w-24">Status</th>
            <th className="px-4 py-3 w-36">Category</th>
            <th className="px-4 py-3 w-28">Element</th>
            <th className="px-4 py-3">Check</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Limit</th>
            <th className="px-4 py-3">Clause</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={r.id}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                i % 2 === 0 ? '' : 'bg-slate-50/40'
              }`}
            >
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{r.category}</td>
              <td className="px-4 py-3 font-medium text-slate-700">{r.element}</td>
              <td className="px-4 py-3 text-slate-700">
                {r.check}
                {r.notes && (
                  <p className="mt-0.5 text-xs text-slate-400">{r.notes}</p>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-slate-600">{r.value}</td>
              <td className="px-4 py-3 font-mono text-slate-600">{r.limit}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{r.clause}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const styles: Record<CheckStatus, string> = {
    pass:    'bg-green-100 text-green-800',
    fail:    'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info:    'bg-blue-100 text-blue-800',
  }
  const icons: Record<CheckStatus, string> = {
    pass: '✓', fail: '✗', warning: '⚠', info: 'ℹ',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      <span>{icons[status]}</span>
      <span className="capitalize">{status}</span>
    </span>
  )
}
