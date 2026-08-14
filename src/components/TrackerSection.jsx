export default function TrackerSection({ icon, label, placeholder, value, onChange }) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white overflow-hidden transition-colors hover:border-zinc-300 shadow-sm">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 bg-zinc-50">
        <span className="text-zinc-400 text-sm select-none">{icon}</span>
        <span className="text-sm font-medium text-zinc-700 tracking-tight">{label}</span>
        {value.trim().length > 0 && (
          <span className="ml-auto text-xs text-zinc-400">
            {value.trim().split('\n').filter(l => l.trim()).length} lines
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="
          w-full px-5 py-4 bg-white
          text-sm text-zinc-800 placeholder-zinc-300
          leading-relaxed resize-y
          focus:outline-none
          font-mono
        "
      />
    </div>
  )
}
