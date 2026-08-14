const SYSTEM_PROMPT = `You are a chief of staff at a fast-growing biotech startup. Analyse the customer, supplier and hiring data provided. Return a JSON object with: items (array of objects with text, category (one of: customer, supplier, hiring), status (one of: RED, AMBER, GREEN), and reason (one concise sentence explaining the status)), summary (one sentence overview of the day), and topPriorities (array of exactly 3 specific action items the founder should act on today). Detect RED/AMBER/GREEN intelligently based on urgency and risk. Return only valid JSON with no markdown formatting or code fences.`

export async function callClaude(apiKey, inputs) {
  const parts = []
  if (inputs.customer.trim()) parts.push(`CUSTOMER TRACKER:\n${inputs.customer.trim()}`)
  if (inputs.supplier.trim()) parts.push(`SUPPLIER TRACKER:\n${inputs.supplier.trim()}`)
  if (inputs.hiring.trim())   parts.push(`HIRING TRACKER:\n${inputs.hiring.trim()}`)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: parts.join('\n\n') }],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = (data.content?.[0]?.text ?? '').trim()

  // Strip any accidental markdown code fences
  const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = JSON.parse(jsonStr)

  return transformToBrief(parsed)
}

function transformToBrief(ai) {
  const { items = [], summary = '', topPriorities = [] } = ai

  const sectionMap = {
    customer: { id: 'customer', title: 'Customer Tracker', items: [] },
    supplier: { id: 'supplier', title: 'Supplier Tracker', items: [] },
    hiring:   { id: 'hiring',   title: 'Hiring Tracker',   items: [] },
  }

  const counts = { red: 0, amber: 0, green: 0 }

  for (const item of items) {
    const status = (item.status || 'AMBER').toLowerCase()
    const key = (item.category || '').toLowerCase()
    const section = sectionMap[key] ?? sectionMap.customer
    section.items.push({ text: item.text || '', status, reason: item.reason || '' })
    if (counts[status] !== undefined) counts[status]++
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return {
    date,
    sections: Object.values(sectionMap).filter(s => s.items.length > 0),
    counts,
    summary,
    topPriorities,
    isAIGenerated: true,
  }
}
