import type { AlignmentData, CheckResult, CheckStatus } from '../types/geometry'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_RANK: Record<CheckStatus, number> = { fail: 0, warning: 1, info: 2, pass: 3 }

function worstStatus(results: CheckResult[]): CheckStatus {
  if (results.length === 0) return 'pass'
  return results.reduce<CheckStatus>(
    (worst, r) => STATUS_RANK[r.status] < STATUS_RANK[worst] ? r.status : worst,
    'pass'
  )
}

const STATUS_CELL: Record<CheckStatus, string> = {
  pass:    'bg-green-50 text-green-800',
  fail:    'bg-red-50 text-red-800',
  warning: 'bg-amber-50 text-amber-800',
  info:    'bg-blue-50 text-blue-800',
}
const STATUS_OVERALL: Record<CheckStatus, string> = {
  pass:    'bg-green-100 text-green-900',
  fail:    'bg-red-100 text-red-900',
  warning: 'bg-amber-100 text-amber-900',
  info:    'bg-blue-100 text-blue-900',
}
const STATUS_ICON: Record<CheckStatus, string> = {
  pass: '✓', fail: '✗', warning: '⚠', info: 'ℹ',
}

// ─── Shared cell components ───────────────────────────────────────────────────

function CheckCell({ result }: { result?: CheckResult }) {
  if (!result) {
    return <td className="border border-slate-200 px-2 py-2 text-center text-slate-300 text-xs select-none">—</td>
  }
  const showLimit = result.status === 'fail' || result.status === 'warning'
  return (
    <td
      className={`border border-slate-200 px-2 py-2 text-center text-xs ${STATUS_CELL[result.status]}`}
      title={`${result.check}\nValue: ${result.value}\nLimit: ${result.limit}${result.notes ? '\n' + result.notes : ''}`}
    >
      <div className="font-bold">{STATUS_ICON[result.status]}</div>
      <div className="font-mono text-[10px] mt-0.5 leading-tight">{result.value}</div>
      {showLimit && (
        <div className="font-mono text-[10px] mt-0.5 leading-tight opacity-70">({result.limit})</div>
      )}
    </td>
  )
}

function OverallCell({ results }: { results: CheckResult[] }) {
  const status = worstStatus(results)
  const issues = results.filter(r => r.status === 'fail' || r.status === 'warning')
  return (
    <td className={`border border-slate-200 px-3 py-2 text-xs font-semibold min-w-[120px] ${STATUS_OVERALL[status]}`}>
      <div>{STATUS_ICON[status]} {status.charAt(0).toUpperCase() + status.slice(1)}</div>
      {issues.length > 0 && (
        <ul className="mt-1 space-y-0.5 font-normal">
          {issues.map(r => (
            <li key={r.id} className="text-[10px] leading-snug">
              {STATUS_ICON[r.status]} {r.check}: {r.value}
            </li>
          ))}
        </ul>
      )}
    </td>
  )
}

const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`border border-slate-200 px-3 py-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 ${className}`}>
    {children}
  </th>
)

// ─── Horizontal IPs matrix ────────────────────────────────────────────────────

function HorizontalMatrix({ data, results }: { data: AlignmentData; results: CheckResult[] }) {
  const { horizontalIPs } = data
  if (horizontalIPs.length === 0) return null

  const horizResults = results.filter(r => r.category === 'Horizontal Alignment')
  const superResults = results.filter(r => r.category === 'Superelevation')
  const chainResults = results.filter(r => r.category === 'Chainages')
  const hasSuper = superResults.length > 0

  function findCheck(ipId: string, fragment: string) {
    const exact = `IP ${ipId}`
    return [...horizResults, ...chainResults].find(r =>
      (r.element === exact || r.element === `${exact} (compound)`) &&
      r.check.includes(fragment)
    )
  }

  function allForIP(ipId: string, ipChainage: number, arcLength: number) {
    const exact = `IP ${ipId}`
    const checks = [...horizResults, ...chainResults].filter(r =>
      r.element === exact ||
      r.element === `${exact} (compound)` ||
      r.element.startsWith(`${exact} –`) ||
      (r.element.startsWith('IP ') && r.element.endsWith(`– IP ${ipId}`))
    )
    if (!hasSuper) return checks
    const halfArc = Math.max(arcLength / 2, 50)
    const superChecks = superResults.filter(r => {
      const ch = parseFloat(r.element.replace('Ch ', ''))
      return !isNaN(ch) && Math.abs(ch - ipChainage) <= halfArc
    })
    return [...checks, ...superChecks]
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Horizontal Alignment</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <TH className="sticky left-0 z-10">IP</TH>
              <TH>Chainage (m)</TH>
              <TH>Dir</TH>
              <TH>Radius (m)</TH>
              <TH>Arc (m)</TH>
              <TH>Min Radius</TH>
              <TH>Curve Length</TH>
              <TH>Trans In</TH>
              <TH>Trans Out</TH>
              <TH>Comp. Ratio</TH>
              <TH>Short Curve</TH>
              <TH>Broken Back</TH>
              <TH>Reverse Curve</TH>
              {hasSuper && <TH>Superelevation</TH>}
              <TH>Overall</TH>
            </tr>
          </thead>
          <tbody>
            {horizontalIPs.map((ip, i) => (
              <tr key={ip.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 sticky left-0 bg-inherit">{ip.id}</td>
                <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{ip.chainage.toFixed(3)}</td>
                <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-600">{ip.deflectionDirection}</td>
                <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{ip.radius.toFixed(1)}</td>
                <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{ip.arcLength.toFixed(1)}</td>
                <CheckCell result={findCheck(ip.id, 'Minimum curve radius (absolute)')} />
                <CheckCell result={findCheck(ip.id, 'Minimum curve length')} />
                <CheckCell result={findCheck(ip.id, 'Transition length in (absolute min)')} />
                <CheckCell result={findCheck(ip.id, 'Transition length out (absolute min)')} />
                <CheckCell result={findCheck(ip.id, 'Compound curve radius ratio')} />
                <CheckCell result={findCheck(ip.id, 'Short curve appearance')} />
                <CheckCell result={findCheck(ip.id, 'Broken back curve')} />
                <CheckCell result={findCheck(ip.id, 'Reverse curve')} />
                {hasSuper && (
                  <OverallCell results={superResults.filter(r => {
                    const ch = parseFloat(r.element.replace('Ch ', ''))
                    return !isNaN(ch) && Math.abs(ch - ip.chainage) <= Math.max(ip.arcLength / 2, 50)
                  })} />
                )}
                <OverallCell results={allForIP(ip.id, ip.chainage, ip.arcLength)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Vertical IPs matrix ─────────────────────────────────────────────────────

function VerticalMatrix({ data, results }: { data: AlignmentData; results: CheckResult[] }) {
  const { verticalIPs, gradeSections } = data
  if (verticalIPs.length === 0) return null

  const vertResults = results.filter(r => r.category === 'Vertical Alignment')
  const chainResults = results.filter(r => r.category === 'Chainages')

  function sectionLabel(from: number, to: number) {
    return `Ch ${from.toFixed(0)}\u2013${to.toFixed(0)}`
  }

  function gradeCheck(from: number, to: number, fragment: string) {
    const label = sectionLabel(from, to)
    return vertResults.find(r => r.element === label && r.check.includes(fragment))
  }

  function vipCheck(vipId: string, fragment: string) {
    return vertResults.find(r => r.element === `VIP ${vipId}` && r.check.includes(fragment))
  }

  function allForVIP(vipId: string, vipCh: number) {
    const vipChecks = [...vertResults, ...chainResults].filter(r => r.element === `VIP ${vipId}`)
    // Also include grade section checks for sections adjacent to this VIP
    const sectionChecks = vertResults.filter(r => {
      if (!r.element.startsWith('Ch ')) return false
      // Parse "Ch X–Y"
      const parts = r.element.replace('Ch ', '').split('\u2013')
      if (parts.length !== 2) return false
      const from = parseFloat(parts[0])
      const to   = parseFloat(parts[1])
      return Math.abs(from - vipCh) < 1 || Math.abs(to - vipCh) < 1
    })
    return [...vipChecks, ...sectionChecks]
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Vertical Alignment</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <TH className="sticky left-0 z-10">VIP</TH>
              <TH>Chainage (m)</TH>
              <TH>VC Type</TH>
              <TH>Grade In (%)</TH>
              <TH>Grade Out (%)</TH>
              <TH>Max Grade In</TH>
              <TH>Max Grade Out</TH>
              <TH>Min Grade Out</TH>
              <TH>K Value</TH>
              <TH>VC Length</TH>
              <TH>VC Spacing</TH>
              <TH>Overall</TH>
            </tr>
          </thead>
          <tbody>
            {verticalIPs.map((vip, i) => {
              const secIn  = gradeSections.find(s => Math.abs(s.toChainage   - vip.chainage) < 0.5)
              const secOut = gradeSections.find(s => Math.abs(s.fromChainage - vip.chainage) < 0.5)
              return (
                <tr key={vip.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-700 sticky left-0 bg-inherit">{vip.id}</td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{vip.chainage.toFixed(3)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600 capitalize">{vip.vcType === 'none' ? 'Line' : vip.vcType}</td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{vip.gradeIn.toFixed(2)}</td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-slate-600 text-right">{vip.gradeOut.toFixed(2)}</td>
                  <CheckCell result={secIn  ? gradeCheck(secIn.fromChainage,  secIn.toChainage,  'Maximum longitudinal grade') : undefined} />
                  <CheckCell result={secOut ? gradeCheck(secOut.fromChainage, secOut.toChainage, 'Maximum longitudinal grade') : undefined} />
                  <CheckCell result={secOut ? gradeCheck(secOut.fromChainage, secOut.toChainage, 'Minimum grade') : undefined} />
                  <CheckCell result={vipCheck(vip.id, 'K value')} />
                  <CheckCell result={vipCheck(vip.id, 'Minimum vertical curve length')} />
                  <CheckCell result={vipCheck(vip.id, 'Vertical curve spacing')} />
                  <OverallCell results={allForVIP(vip.id, vip.chainage)} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Chainages banner (non-IP issues) ────────────────────────────────────────

function ChainageIssues({ results }: { results: CheckResult[] }) {
  const issues = results.filter(r => r.category === 'Chainages' && r.status !== 'pass')
  if (issues.length === 0) return null
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Chainage Issues</h3>
      <ul className="space-y-1">
        {issues.map(r => (
          <li key={r.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <span className="font-semibold">{r.element}</span> — {r.check}: {r.value}
            {r.notes && <span className="text-red-600"> ({r.notes})</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  data: AlignmentData
  results: CheckResult[]
}

export function IPMatrixTable({ data, results }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        <div className="p-6 space-y-8">
          <HorizontalMatrix data={data} results={results} />
          <VerticalMatrix   data={data} results={results} />
          <ChainageIssues   results={results} />
        </div>
      </div>
    </div>
  )
}
