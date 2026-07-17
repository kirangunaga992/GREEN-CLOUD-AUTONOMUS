import { format } from 'date-fns'

const colors = {
  scale_up: 'text-green-400 bg-green-400/10',
  scale_down: 'text-yellow-400 bg-yellow-400/10',
  scale_to_zero: 'text-red-400 bg-red-400/10',
  no_change: 'text-slate-400 bg-slate-400/10',
}

export default function ScalingEventsTable({ events }) {
  if (!events?.length) return <div className="text-center text-slate-500 py-8">No scaling events yet</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-700">
            <th className="text-left py-3 px-4">Time</th>
            <th className="text-left py-3 px-4">Action</th>
            <th className="text-left py-3 px-4">Replicas</th>
            <th className="text-left py-3 px-4">Users</th>
            <th className="text-left py-3 px-4">CPU</th>
            <th className="text-left py-3 px-4">Reason</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="py-3 px-4 text-slate-400">{e.timestamp ? format(new Date(e.timestamp), 'HH:mm:ss') : '—'}</td>
              <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs ${colors[e.action]||colors.no_change}`}>{e.action?.replace('_',' ').toUpperCase()}</span></td>
              <td className="py-3 px-4 text-white font-mono">{e.current_replicas} → {e.desired_replicas}</td>
              <td className="py-3 px-4 text-slate-300">{e.active_users}</td>
              <td className="py-3 px-4 text-slate-300">{e.cpu_percent?.toFixed(1)}%</td>
              <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">{e.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
