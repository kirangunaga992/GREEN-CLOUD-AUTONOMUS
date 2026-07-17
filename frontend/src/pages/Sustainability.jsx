import { useState, useEffect } from 'react'
import { getSustainability } from '../api/backendApi'
import KPICard from '../components/KPICard'
import { SimpleLineChart } from '../charts/MetricsChart'

export default function Sustainability() {
  const [data, setData] = useState(null)
  useEffect(() => {
    const f = async () => { try { const r = await getSustainability(); if (r.success) setData(r) } catch {} }
    f(); const id = setInterval(f, 10000); return () => clearInterval(id)
  }, [])
  const t = data?.today_totals || {}
  const h = data?.history || []
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">🌱 Sustainability</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Energy Used" value={t.energy_kwh_today?.toFixed(6) ?? 0} unit="kWh" icon="🔋" color="yellow" />
        <KPICard title="Energy Saved" value={t.saved_energy_kwh_today?.toFixed(6) ?? 0} unit="kWh" icon="💡" color="green" />
        <KPICard title="Carbon" value={t.carbon_kg_today?.toFixed(6) ?? 0} unit="kg" icon="💨" color="red" />
        <KPICard title="Carbon Saved" value={t.carbon_saved_kg_today?.toFixed(6) ?? 0} unit="kg" icon="🌱" color="green" />
      </div>
      {h.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Energy History</h3>
          <SimpleLineChart data={h} dataKey="actual_energy_kwh" color="#f59e0b" label="Energy" unit=" kWh" />
        </div>
      )}
    </div>
  )
}
