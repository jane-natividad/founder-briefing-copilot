import { useState } from 'react'

export default function ApiKeyInput({ value, onChange }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-8">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className="text-sm font-medium text-zinc-700">Anthropic API Key</span>
        <div className="ml-auto flex items-center gap-1.5">
          {value.trim() ? (
            <span className="text-[10px] font-semibold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
              Connected
            </span>
          ) : (
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full uppercase">
              Optional — uses local detection
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3.5 flex items-center gap-3">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="sk-ant-api03-..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 text-sm font-mono text-zinc-800 placeholder-zinc-300 bg-transparent focus:outline-none min-w-0"
        />
        {value && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 text-xs text-zinc-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-zinc-100 bg-zinc-50/50">
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Stored in browser memory only — never persisted, logged, or sent anywhere except directly to{' '}
          <span className="font-medium text-zinc-500">api.anthropic.com</span>.
        </p>
      </div>
    </div>
  )
}
