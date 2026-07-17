import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserActivity } from '../api/backendApi'
import KPICard from '../components/KPICard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import { format } from 'date-fns'

const FEATURE_COLORS = {
  analytics: '#3b82f6',
  ai_compute: '#8b5cf6',
  file_storage: '#22c55e',
  email: '#f59e0b',
  video: '#ef4444'
}

const FEATURE_NAMES = {
  analytics: 'Analytics',
  ai_compute: 'AI Compute',
  file_storage: 'File Storage',
  email: 'Email',
  video: 'Video'
}

const FEATURE_ICONS = {
  analytics: '📊',
  ai_compute: '🤖',
  file_storage: '🗄️',
  email: '��',
  video: '🎬'
}

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getUserActivity(userId, 200)
        if (res.success) {
          setData(res)
          setError(null)
        }
      } catch (e) {
        setError('Failed to load user details')
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const id = setInterval(fetch, 3000)
    return () => clearInterval(id)
  }, [userId])

  if (loading) return <div className="p-16 text-center text-slate-400">Loading user...</div>

  if (error || !data) return (
    <div className="p-16 text-center">
      <p className="text-red-400 mb-4">{error || 'User not found'}</p>
      <button onClick={() => navigate('/')} className="text-green-400 hover:underline">
        ← Back to Dashboard
      </button>
    </div>
  )

  const { user, activity, summary } = data

  // Prepare pie chart data
  const pieData = Object.entries(user.features_used || {})
    .filter(([_, count]) => count > 0)
    .map(([feature, count]) => ({
      name: FEATURE_NAMES[feature] || feature,
      value: count,
      color: FEATURE_COLORS[feature]
    }))

  // Prepare bar chart data
  const barData = Object.entries(user.features_used || {})
    .map(([feature, count]) => ({
      name: FEATURE_NAMES[feature] || feature,
      icon: FEATURE_ICONS[feature],
      count: count,
      color: FEATURE_COLORS[feature]
    }))

  // Prepare timeline chart (group by minute)
  const timelineData = groupActivityByMinute(activity)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">👤</span>
            {user.name}
            {user.is_online && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                LIVE
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Email</div>
            <div className="text-white">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Joined</div>
            <div className="text-white">
              {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Last Login</div>
            <div className="text-white">
              {user.last_login ? format(new Date(user.last_login), 'dd MMM HH:mm') : 'Never'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Active Devices</div>
            <div className="text-cyan-400 font-bold">
              {user.active_devices > 0 ? `📱 ${user.active_devices}` : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Big Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Requests" value={user.total_requests || 0} icon="⚡" color="cyan" subtitle="All-time" />
        <KPICard title="Energy Used" value={(user.total_energy_kwh || 0).toFixed(6)} unit="kWh" icon="🔋" color="yellow" subtitle="Consumed" />
        <KPICard title="Carbon" value={(user.total_carbon_kg || 0).toFixed(6)} unit="kg" icon="🌱" color="red" subtitle="CO₂ emitted" />
        <KPICard title="Amount Charged" value={`₹${(user.total_cost_inr || 0).toFixed(4)}`} icon="💰" color="green" subtitle="Total" />
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard title="Actions Last Hour" value={summary.actions_last_hour || 0} icon="⏰" color="blue" />
        <KPICard title="Actions Last 24h" value={summary.actions_last_24h || 0} icon="📅" color="purple" />
        <KPICard title="Total Actions" value={summary.total_actions || 0} icon="📊" color="green" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - features used */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">📊 Feature Usage Breakdown</h3>
          {barData.some(b => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="count">
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-16">No feature usage yet</p>
          )}
        </div>

        {/* Pie chart - distribution */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">🥧 Usage Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-16">No data to show</p>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">📈 Activity Timeline (Requests Over Time)</h3>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-center py-16">No activity recorded yet</p>
        )}
      </div>

      {/* Recent Activity List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">📋 Recent Activity Log</h3>
        {activity && activity.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...activity].reverse().slice(0, 30).map((a, i) => (
              <div key={i} className="flex items-center gap-4 py-2 px-3 hover:bg-slate-800/50 rounded">
                <span className="text-2xl">{FEATURE_ICONS[a.feature] || '⚙️'}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    Used {FEATURE_NAMES[a.feature] || a.feature}
                  </div>
                  <div className="text-xs text-slate-500">
                    {a.timestamp ? format(new Date(a.timestamp), 'HH:mm:ss') : '—'}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-green-400">₹{a.cost_inr?.toFixed(4)}</div>
                  <div className="text-xs text-slate-500">
                    {a.energy_kwh?.toFixed(6)} kWh
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No activity yet</p>
        )}
      </div>
    </div>
  )
}

// Helper: Group activity by minute for timeline
function groupActivityByMinute(activity) {
  if (!activity || activity.length === 0) return []
  const groups = {}
  activity.forEach(a => {
    if (!a.timestamp) return
    const date = new Date(a.timestamp)
    const key = format(date, 'HH:mm')
    groups[key] = (groups[key] || 0) + 1
  })
  return Object.entries(groups).map(([time, count]) => ({ time, count }))
}
