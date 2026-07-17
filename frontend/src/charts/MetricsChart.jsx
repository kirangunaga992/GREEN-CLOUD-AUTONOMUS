import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

const fmt = ts => { try { return format(new Date(ts), 'HH:mm:ss') } catch { return ts } }

export function SimpleLineChart({ data, dataKey, color, label, unit }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} width={35} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} labelFormatter={fmt} formatter={v => [`${v}${unit||''}`, label]} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CPUMemoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis domain={[0,100]} tick={{ fill: '#64748b', fontSize: 11 }} width={35} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} labelFormatter={fmt} formatter={(v,n) => [`${v.toFixed(1)}%`, n]} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
        <Line type="monotone" dataKey="cpu_percent" name="CPU %" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="memory_percent" name="Memory %" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ReplicaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis domain={[0,5]} ticks={[0,1,2,3,4,5]} tick={{ fill: '#64748b', fontSize: 11 }} width={25} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} labelFormatter={fmt} formatter={v => [`${v} pods`, 'Replicas']} />
        <Line type="stepAfter" dataKey="current_replicas" stroke="#22c55e" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
