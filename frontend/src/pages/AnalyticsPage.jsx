import { useLiveMetrics } from '../hooks/useLiveMetrics'
import ActivityHeatmap from '../components/ActivityHeatmap'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { format } from 'date-fns'

const fmt = (ts) => { try { return format(new Date(ts), 'HH:mm:ss') } catch { return ts } }

const COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
  cyan: '#06b6d4'
}

function Panel({ title, subtitle, children, height = 340 }) {
  return (
    <div className="bg-gradient-to-br from-[#151922] to-[#0f1420] border border-[#2c3543] rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ height: height + 'px' }}>
      <div className="px-5 py-3 border-b border-[#2c3543] flex items-center justify-between">
        <div>
          <div className="text-white text-sm font-bold">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="p-4 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { history, users, loading } = useLiveMetrics()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-pulse">📈</div>
    </div>
  )

  const validHistory = history && history.length > 0 ? history : []

  // Feature usage aggregation
  const featureUsage = ['analytics', 'ai_compute', 'file_storage', 'email', 'video'].reduce((acc, f) => {
    acc[f] = users.reduce((s, u) => s + (u.features_used?.[f] || 0), 0)
    return acc
  }, {})

  const radarData = [
    { subject: 'Analytics', A: featureUsage.analytics, fullMark: 100 },
    { subject: 'AI Compute', A: featureUsage.ai_compute, fullMark: 100 },
    { subject: 'Storage', A: featureUsage.file_storage, fullMark: 100 },
    { subject: 'Email', A: featureUsage.email, fullMark: 100 },
    { subject: 'Video', A: featureUsage.video, fullMark: 100 }
  ]

  const cpuMemData = validHistory.map(h => ({
    ...h,
    cpu: h.cpu_percent || 0,
    memory: h.memory_percent || 0
  }))

  const carbonData = validHistory.map(h => ({
    ...h,
    carbon: Math.round((h.active_users || 0) * 45 * 100) / 100,
    energy: Math.round((35 + 55 * (h.cpu_percent || 0) / 100) * (h.current_replicas || 0))
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <p className="text-sm text-slate-400 mt-1">Deep insights into system performance and sustainability</p>
      </div>

      {/* Row 1: CPU + Memory & Carbon + Energy */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="System Resources" subtitle="CPU and Memory utilization">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cpuMemData} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
              <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{fill:'#94a3b8', fontSize:11}}/>
              <YAxis tick={{fill:'#94a3b8', fontSize:11}} domain={[0, 100]}/>
              <Tooltip contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px'}}/>
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke={COLORS.orange} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="memory" name="Memory %" stroke={COLORS.purple} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Carbon & Energy" subtitle="Environmental impact over time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={carbonData} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
              <defs>
                <linearGradient id="carbonG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.7}/>
                  <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="energyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.yellow} stopOpacity={0.7}/>
                  <stop offset="100%" stopColor={COLORS.yellow} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
              <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{fill:'#94a3b8', fontSize:11}}/>
              <YAxis tick={{fill:'#94a3b8', fontSize:11}}/>
              <Tooltip contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px'}}/>
              <Area type="monotone" dataKey="carbon" name="Carbon (g)" stroke={COLORS.red} fill="url(#carbonG)" strokeWidth={2}/>
              <Area type="monotone" dataKey="energy" name="Energy (W)" stroke={COLORS.yellow} fill="url(#energyG)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 2: Feature Radar + Activity Heatmap */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Feature Usage Pattern" subtitle="Radar view of service consumption">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2c3543"/>
              <PolarAngleAxis dataKey="subject" tick={{fill:'#94a3b8', fontSize:11}}/>
              <PolarRadiusAxis tick={{fill:'#94a3b8', fontSize:10}}/>
              <Radar name="Usage" dataKey="A" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.4}/>
              <Tooltip contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px'}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Activity Heatmap" subtitle="Weekly usage patterns by hour">
          <div className="h-full flex items-center">
            <ActivityHeatmap/>
          </div>
        </Panel>
      </div>

      {/* Row 3: Top Users */}
      <Panel title="Top Users by Activity" subtitle="Most active users in the platform" height={320}>
        <div className="h-full overflow-y-auto space-y-2">
          {[...users]
            .sort((a, b) => (b.total_requests || 0) - (a.total_requests || 0))
            .slice(0, 8)
            .map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-[#0f1420] border border-[#2c3543] rounded-lg hover:border-green-500/30 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                  i === 2 ? 'bg-gradient-to-br from-orange-600 to-red-700' :
                  'bg-gradient-to-br from-slate-600 to-slate-800'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{u.name}</div>
                  <div className="text-slate-500 text-xs">{u.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-bold">{u.total_requests || 0}</div>
                  <div className="text-slate-500 text-xs">requests</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm font-bold">₹{(u.total_cost_inr || 0).toFixed(4)}</div>
                  <div className="text-slate-500 text-xs">spent</div>
                </div>
                {u.is_online && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                )}
              </div>
            ))
          }
        </div>
      </Panel>

    </div>
  )
}
