export default function KPICard({ title, value, unit, icon, color = 'green', subtitle }) {
  const colors = {
    green: 'border-green-500 bg-green-500/10',
    blue: 'border-blue-500 bg-blue-500/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
    red: 'border-red-500 bg-red-500/10',
    purple: 'border-purple-500 bg-purple-500/10',
    cyan: 'border-cyan-500 bg-cyan-500/10',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-white">{value ?? '—'}</span>
        {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  )
}
