const RED_SIGNALS = [
  'urgent', 'blocked', 'block', 'delay', 'delayed', 'missing', 'failed', 'fail',
  'rejected', 'reject', 'overdue', 'critical', 'lost', 'churn', 'cancel', 'cancelled',
  'terminated', 'terminate', 'broken', 'stuck', 'unresponsive', 'ghosted', 'ghost',
  'no response', 'escalat', 'behind', 'problem', 'issue', 'dropped', 'dead',
  'resigned', 'quit', 'fired', 'pulled out', 'walked away', 'fell through',
  'not responding', 'breach', 'over budget', 'crisis', 'at risk',
]

const GREEN_SIGNALS = [
  'signed', 'closed', 'shipped', 'complete', 'completed', 'approved', 'confirmed',
  'successful', 'launched', 'hired', 'onboard', 'won', 'delivered', 'received',
  'agreed', 'committed', 'paid', 'great', 'excellent', 'ahead', 'on track',
  'done', 'good', 'progressing well', 'intro done', 'demo done', 'offer accepted',
  'contract sent', 'contract signed', 'deal closed', 'moved forward',
]

export function detectStatus(text) {
  const lower = text.toLowerCase()
  if (RED_SIGNALS.some(s => lower.includes(s))) return 'red'
  if (GREEN_SIGNALS.some(s => lower.includes(s))) return 'green'
  return 'amber'
}

export function generateBrief(inputs) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const sections = [
    { id: 'customer', title: 'Customer Tracker', items: parseLines(inputs.customer) },
    { id: 'supplier', title: 'Supplier Tracker', items: parseLines(inputs.supplier) },
    { id: 'hiring',   title: 'Hiring Tracker',   items: parseLines(inputs.hiring) },
  ]

  const counts = { red: 0, amber: 0, green: 0 }
  sections.forEach(s => s.items.forEach(item => { counts[item.status]++ }))

  return {
    date,
    sections,
    counts,
    summary: '',
    topPriorities: [],
    isAIGenerated: false,
  }
}

function parseLines(raw) {
  if (!raw?.trim()) return []
  return raw
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\•\·]+/, '').trim())
    .filter(line => line.length > 2)
    .map(text => ({ text, status: detectStatus(text), reason: '' }))
}
