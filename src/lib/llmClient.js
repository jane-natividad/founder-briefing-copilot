// Provider-agnostic LLM client — bring-your-own key, called directly from the browser.
// Supports two API styles, which together cover most hosted and local models:
//   • "openai"    — any OpenAI-compatible Chat Completions endpoint
//                   (OpenAI, OpenRouter, Groq, Together, a local Llama server such as Ollama or LM Studio, …)
//   • "anthropic" — the Anthropic Messages API
// The key lives in React state only: never stored, never logged, sent only to the endpoint you choose.

export const PROVIDERS = {
  openai: {
    label: 'OpenAI-compatible API (OpenAI, OpenRouter, Groq, Together, local Llama…)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    keyPlaceholder: 'Your API key',
  },
  anthropic: {
    label: 'Anthropic Messages API',
    baseUrl: 'https://api.anthropic.com/v1',
    model: '',
    keyPlaceholder: 'Your API key',
  },
}

export function defaultLlmConfig(provider = 'openai') {
  const p = PROVIDERS[provider]
  return { provider, apiKey: '', baseUrl: p.baseUrl, model: p.model }
}

export function switchProvider(config, provider) {
  const p = PROVIDERS[provider]
  return { ...config, provider, baseUrl: p.baseUrl, model: p.model }
}

export function endpointHost(config) {
  try { return new URL(config.baseUrl).host } catch { return config.baseUrl }
}

/**
 * Send one prompt (plus optional system instructions) and return the model's text reply.
 * @param {{provider:string, apiKey:string, baseUrl:string, model:string}} config
 * @param {{system?:string, prompt:string, maxTokens?:number}} request
 */
export async function callLLM(config, { system, prompt, maxTokens = 1024 }) {
  if (!config.model || !config.model.trim()) throw new Error('Add a model name under "Endpoint & model (advanced)".')
  const base = (config.baseUrl || '').replace(/\/+$/, '')
  let res
  if (config.provider === 'anthropic') {
    res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } else {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    })
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    const msg = (data.error && (data.error.message || data.error)) || `API error ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  const text = config.provider === 'anthropic'
    ? (data.content || []).map(c => c.text || '').join('')
    : (data.choices?.[0]?.message?.content ?? '')
  return text.trim()
}

/** Pull the first JSON object out of a model reply (tolerates code fences or extra prose). */
export function parseJsonReply(text) {
  const clean = text.replace(/```(?:json)?/gi, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  return JSON.parse(match ? match[0] : clean)
}
