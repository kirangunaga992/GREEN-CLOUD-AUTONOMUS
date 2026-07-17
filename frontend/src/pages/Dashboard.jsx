import { useState, useEffect } from 'react'
import { useLiveMetrics } from '../hooks/useLiveMetrics'
import Speedometer from '../components/Speedometer'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, Legend
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

function Panel({ title, subtitle, children, height = 320 }) {
  return (
    <div className="bg-gradient-to-br from-[#151922] to-[#0f1420] border border-[#2c3543] rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ height: height + 'px' }}>
      <div className="px-5 py-3 border-b border-[#2c3543] flex items-center justify-between bg-[#0f1420]/50">
        <div>
          <div className="text-white text-sm font-bold tracking-wide">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      </div>
      <div className="p-4 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

function BigStatCard({ label, value, unit, icon, color = 'green', trend }) {
  const colors = {
    green: 'from-green-500/20 to-emerald-500/5 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-cyan-500/5 border-blue-500/30 text-blue-400',
    orange: 'from-orange-500/20 to-red-500/5 border-orange-500/30 text-orange-400',
    purple: 'from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400',
    red: 'from-red-500/20 to-orange-500/5 border-red-500/30 text-red-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</div>
        </div>
        <div className="text-3xl opacity-40">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {trend && (
        <div className="text-xs mt-2 opacity-80">
          {trend}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { summary, history, scalingEvents, users, onlineCount, error, loading } = useLiveMetrics()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-pulse">🌿</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-red-400">{error}</div>
    </div>
  )

  const d = summary || {}
  const currentReplicas = d.current_replicas || 0
  const totalRevenue = users.reduce((s, u) => s + (u.total_cost_inr || 0), 0)
  const totalRequests = users.reduce((s, u) => s + (u.total_requests || 0), 0)
  const totalCarbon = users.reduce((s, u) => s + (u.total_carbon_kg || 0), 0)
  const totalEnergy = users.reduce((s, u) => s + (u.total_energy_kwh || 0), 0)

  const carbonReductionPercent = totalEnergy > 0 
    ? Math.min(Math.round((1 - totalEnergy / (5 * 0.035)) * 100), 99)
    : 100

  // Build data with fallback for empty
  const validHistory = history && history.length > 0 ? history : Array.from({length: 10}, (_, i) => ({
    timestamp: new Date(Date.now() - (10 - i) * 5000).toISOString(),
    active_users: 0,
    current_rps: 0,
    current_replicas: 0,
    cpu_percent: Math.random() * 20,
    memory_percent: 50 + Math.random() * 30
  }))

  const presenceData = validHistory.map(h => ({
    ...h,
    users: h.active_users || 0,
    carbon: Math.round((h.active_users || 0) * 45 * 100) / 100
  }))

  const scalingData = validHistory.map(h => ({
    ...h,
    pods: h.current_replicas || 0,
    users: h.active_users || 0
  }))

  const featureUsage = ['analytics', 'ai_compute', 'file_storage', 'email', 'video'].reduce((acc, f) => {
    acc[f] = users.reduce((s, u) => s + (u.features_used?.[f] || 0), 0)
    return acc
  }, {})

  const featureData = [
    { name: 'Analytics', value: featureUsage.analytics, color: COLORS.blue },
    { name: 'AI Compute', value: featureUsage.ai_compute, color: COLORS.purple },
    { name: 'Storage', value: featureUsage.file_storage, color: COLORS.green },
    { name: 'Email', value: featureUsage.email, color: COLORS.yellow },
    { name: 'Video', value: featureUsage.video, color: COLORS.red }
  ]

  const totalFeatures = Object.values(featureUsage).reduce((s, v) => s + v, 0)

  return (
    <div className="p-6 space-y-6">

      {/* PAGE TITLE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cloud Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time monitoring of your sustainable cloud infrastructure</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#181B1F] border border-[#2c3543] rounded-md px-4 py-2 text-xs text-slate-300">
            🕐 Last 5 minutes
          </div>
          <div className="bg-green-500/20 border border-green-500 rounded-md px-4 py-2 text-xs text-green-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            LIVE · {onlineCount} Active Users
          </div>
        </div>
      </div>

      {/* BIG KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <BigStatCard 
          label="Active Users" 
          value={onlineCount} 
          unit={`/ ${users.length}`}
          icon="👥"
          color="green"
          trend={`${users.length} total registered`}
        />
        <BigStatCard 
          label="Running Pods" 
          value={currentReplicas} 
          unit="/ 5 max"
          icon="🚀"
          color="blue"
          trend={currentReplicas > 0 ? '● ACTIVE' : '● IDLE'}
        />
        <BigStatCard 
          label="Carbon Saved" 
          value={((d.carbon_saved_kg_today || 0) * 1000).toFixed(1)} 
          unit="g CO₂"
          icon="🌱"
          color="green"
          trend={`${carbonReductionPercent}% reduction`}
        />
        <BigStatCard 
          label="Total Revenue" 
          value={`₹${totalRevenue.toFixed(2)}`} 
          icon="💰"
          color="orange"
          trend={`${totalRequests} total requests`}
        />
      </div>

      {/* MAIN CHART: USER PRESENCE (BIG) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Panel title="User Activity Over Time" subtitle="Real-time user presence and carbon impact" height={380}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={presenceData} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.6}/>
                    <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
                <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{fill:'#94a3b8', fontSize:11}} axisLine={{stroke:'#334155'}}/>
                <YAxis tick={{fill:'#94a3b8', fontSize:11}} axisLine={{stroke:'#334155'}} label={{value: 'Active Users', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11}}/>
                <YAxis yAxisId="right" orientation="right" tick={{fill:'#94a3b8', fontSize:11}} axisLine={{stroke:'#334155'}} label={{value: 'CO₂ (g)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11}}/>
                <Tooltip 
                  contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px', fontSize:'12px'}} 
                  labelFormatter={fmt}
                />
                <Legend wrapperStyle={{fontSize:'12px', color:'#94a3b8', paddingTop: '10px'}}/>
                <Area type="monotone" dataKey="users" name="Active Users" stroke={COLORS.green} fill="url(#userGrad)" strokeWidth={3}/>
                <Area yAxisId="right" type="monotone" dataKey="carbon" name="Carbon Footprint (g)" stroke={COLORS.red} fill="url(#carbonGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Speedometer + Info */}
        <div className="col-span-4">
          <Panel title="System Efficiency" subtitle="Carbon reduction vs baseline" height={380}>
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Speedometer value={carbonReductionPercent} label="EFFICIENCY" sublabel={
                carbonReductionPercent > 70 ? 'EXCELLENT' : 
                carbonReductionPercent > 40 ? 'GOOD' : 'OPTIMIZING'
              }/>
              <div className="text-center pt-4 border-t border-[#2c3543] w-full">
                <div className="text-3xl font-bold text-green-400">
                  {(totalCarbon * 1000).toFixed(2)}<span className="text-lg text-slate-500 ml-1">g</span>
                </div>
                <div className="text-xs text-slate-500 uppercase mt-1">Total CO₂ Emitted</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* SECOND ROW: Auto-scaling + Feature Usage */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-6">
          <Panel title="Auto-Scaling Timeline" subtitle="Pods vs user demand">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scalingData} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
                <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{fill:'#94a3b8', fontSize:11}}/>
                <YAxis tick={{fill:'#94a3b8', fontSize:11}} domain={[0, 6]}/>
                <Tooltip 
                  contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px', fontSize:'12px'}} 
                  labelFormatter={fmt}
                />
                <Legend wrapperStyle={{fontSize:'12px', color:'#94a3b8'}}/>
                <Line type="stepAfter" dataKey="pods" name="Active Pods" stroke={COLORS.green} strokeWidth={3} dot={{ fill: COLORS.green, r: 4 }}/>
                <Line type="monotone" dataKey="users" name="Users" stroke={COLORS.yellow} strokeWidth={2} strokeDasharray="5 5" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="col-span-6">
          <Panel title="Service Usage Distribution" subtitle="Total actions per cloud service">
            {totalFeatures > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
                  <XAxis dataKey="name" tick={{fill:'#94a3b8', fontSize:11}}/>
                  <YAxis tick={{fill:'#94a3b8', fontSize:11}}/>
                  <Tooltip 
                    contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px', fontSize:'12px'}}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {featureData.map((f, i) => <Cell key={i} fill={f.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-30">📊</div>
                  <div className="text-sm">No service usage yet</div>
                  <div className="text-xs mt-1">Ask users to click services to see data</div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* THIRD ROW: Energy Trend + Cost Distribution */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-8">
          <Panel title="Energy Consumption Trend" subtitle="Real-time energy usage in Watts">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={validHistory.map(h => ({
                ...h,
                power: Math.round((35 + 55 * (h.cpu_percent || 0) / 100) * (h.current_replicas || 0))
              }))} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.7}/>
                    <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c3543" opacity={0.5}/>
                <XAxis dataKey="timestamp" tickFormatter={fmt} tick={{fill:'#94a3b8', fontSize:11}}/>
                <YAxis tick={{fill:'#94a3b8', fontSize:11}} label={{value: 'Power (W)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11}}/>
                <Tooltip 
                  contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px', fontSize:'12px'}} 
                  labelFormatter={fmt}
                />
                <Legend wrapperStyle={{fontSize:'12px', color:'#94a3b8'}}/>
                <Area type="monotone" dataKey="power" name="Power Consumption (W)" stroke={COLORS.orange} fill="url(#powerGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="col-span-4">
          <Panel title="Cost Breakdown" subtitle="By service category">
            {totalFeatures > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={featureData.filter(f => f.value > 0)} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={50} 
                    outerRadius={85} 
                    dataKey="value"
                    label={{fontSize: 11, fill: '#94a3b8'}}
                  >
                    {featureData.filter(f => f.value > 0).map((f, i) => <Cell key={i} fill={f.color}/>)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{background:'#181B1F', border:'1px solid #2c3543', borderRadius: '8px', fontSize:'12px'}}
                  />
                  <Legend wrapperStyle={{fontSize:'11px', color:'#94a3b8', paddingTop: '10px'}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-30">💰</div>
                  <div className="text-sm">No cost data yet</div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* BOTTOM: Recent Activity Log */}
      <Panel title="Recent Scaling Events" subtitle="Live system activity log" height={280}>
        <div className="h-full overflow-y-auto">
          {scalingEvents && scalingEvents.length > 0 ? (
            <div className="space-y-2">
              {scalingEvents.slice(0, 10).map((e, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-[#0f1420] border border-[#2c3543] rounded-lg hover:border-green-500/30 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                    e.action === 'scale_up' ? 'bg-green-500/20 text-green-400' :
                    e.action === 'scale_down' ? 'bg-yellow-500/20 text-yellow-400' :
                    e.action === 'scale_to_zero' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {e.action === 'scale_up' ? '↑' : e.action === 'scale_down' ? '↓' : e.action === 'scale_to_zero' ? '⊘' : '•'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold">
                      {e.action?.replace('_', ' ').toUpperCase() || 'EVENT'}: {e.current_replicas} → {e.desired_replicas} pods
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{e.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 text-xs">
                      {e.timestamp ? format(new Date(e.timestamp), 'HH:mm:ss') : '-'}
                    </div>
                    <div className="text-slate-600 text-[10px] mt-0.5">
                      {e.active_users} users
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-30">⚡</div>
                <div className="text-sm">No scaling events yet</div>
                <div className="text-xs mt-1">Events will appear when users interact with the system</div>
              </div>
            </div>
          )}
        </div>
      </Panel>

    </div>
  )
}
