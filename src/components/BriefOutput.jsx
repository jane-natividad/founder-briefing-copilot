import { useState } from 'react'

const STATUS = {
  red: {
    badge: 'bg-red-50 text-red-600 border border-red-200',
    dot: 'bg-red-500',
    row: 'border-l-red-400',
    label: 'RED',
    pill: 'bg-red-500',
    counter: 'bg-red-50 border border-red-200 text-red-700',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-600 border border-amber-200',
    dot: 'bg-amber-400',
    row: 'border-l-amber-400',
    label: 'AMBER',
    pill: 'bg-amber-400',
    counter: 'bg-amber-50 border border-amber-200 text-amber-700',
  },
  green: {
    badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    dot: 'bg-emerald-500',
    row: 'border-l-emerald-400',
    label: 'GREEN',
    pill: 'bg-emerald-500',
    counter: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  },
}

const SECTION_ICONS = { customer: '◈', supplier: '◇', hiring: '◉' }

export default function BriefOutput({ brief }) {
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState('all')

  const { counts, sections, date, summary, topPriorities = [], isAIGenerated } = brief
  const total = counts.red + counts.amber + counts.green
  const hasRed = counts.red > 0

  function handleCopy() {
    const priorityLines = topPriorities.length
      ? `TOP PRIORITIES\n${topPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
      : ''
    const sectionLines = sections
      .map(s => `${s.title}\n${s.items.map(i => `[${i.status.toUpperCase()}] ${i.text}${i.reason ? ' — ' + i.reason : ''}`).join('\n')}`)
      .join('\n\n')
    const summaryLine = summary ? `\n\nSummary: ${summary}` : ''
    navigator.clipboard.writeText(`FOUNDER DAILY BRIEF — ${date}\n\n${priorityLines}${sectionLines}${summaryLine}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const visibleSections = sections
    .map(s => ({
      ...s,
      items: filter === 'all' ? s.items : s.items.filter(i => i.status === filter),
    }))
    .filter(s => s.items.length > 0)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">

      {/* Dashboard header */}
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${hasRed ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-sm font-semibold text-zinc-800">Operational Dashboard</span>
            <span className="text-xs text-zinc-400">{date}</span>
            {isAIGenerated && (
              <span className="text-[10px] font-semibold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
                Claude AI
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors px-2.5 py-1 rounded-md hover:bg-zinc-100 border border-transparent hover:border-zinc-200"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* RAG summary counters */}
        <div className="grid grid-cols-3 gap-3">
          {['red', 'amber', 'green'].map(status => {
            const s = STATUS[status]
            const count = counts[status]
            const labels = { red: 'Urgent / Blocked', amber: 'At Risk / Pending', green: 'On Track / Done' }
            return (
              <button
                key={status}
                onClick={() => setFilter(f => f === status ? 'all' : status)}
                className={`
                  rounded-lg px-4 py-3 text-left transition-all
                  ${s.counter}
                  ${filter === status ? 'ring-2 ring-offset-1 ' + (status === 'red' ? 'ring-red-400' : status === 'amber' ? 'ring-amber-400' : 'ring-emerald-400') : ''}
                  ${count === 0 ? 'opacity-40 cursor-default' : 'cursor-pointer hover:opacity-90'}
                `}
                disabled={count === 0}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${s.pill}`} />
                  <span className="text-xs font-semibold tracking-widest">{s.label}</span>
                </div>
                <div className="text-2xl font-bold leading-none">{count}</div>
                <div className="text-xs mt-1 opacity-70">{labels[status]}</div>
              </button>
            )
          })}
        </div>

        {/* Active filter indicator */}
        {filter !== 'all' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Filtering by</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[filter].badge}`}>
              {STATUS[filter].label}
            </span>
            <button onClick={() => setFilter('all')} className="text-xs text-zinc-400 hover:text-zinc-600 underline">
              clear
            </button>
          </div>
        )}
      </div>

      {/* Top Priorities (AI only) */}
      {topPriorities.length > 0 && filter === 'all' && (
        <div className="border-b border-zinc-100">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 border-b border-indigo-100">
            <span className="text-indigo-400 text-xs">⚡</span>
            <span className="text-xs font-semibold tracking-[0.12em] text-indigo-700 uppercase">
              Top Priorities Today
            </span>
          </div>
          <ul className="divide-y divide-zinc-50">
            {topPriorities.map((priority, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-700 leading-relaxed">{priority}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Items by section */}
      <div className="divide-y divide-zinc-100">
        {visibleSections.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-400">No items match this filter.</div>
        ) : (
          visibleSections.map(section => (
            <div key={section.id}>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
                <span className="text-zinc-400 text-xs">{SECTION_ICONS[section.id]}</span>
                <span className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                  {section.title}
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul>
                {section.items.map((item, i) => {
                  const s = STATUS[item.status]
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-4 px-5 py-3.5 border-l-2 ${s.row} hover:bg-zinc-50 transition-colors`}
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 leading-relaxed">{item.text}</p>
                        {item.reason && (
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.reason}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full ${s.badge}`}>
                        {s.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{total} item{total !== 1 ? 's' : ''} total</span>
          {summary && (
            <span className="text-xs text-zinc-500 hidden sm:block">· {summary}</span>
          )}
        </div>
        {hasRed && (
          <span className="text-xs font-medium text-red-600">
            ⚠ {counts.red} item{counts.red !== 1 ? 's' : ''} need{counts.red === 1 ? 's' : ''} attention
          </span>
        )}
      </div>
    </div>
  )
}
