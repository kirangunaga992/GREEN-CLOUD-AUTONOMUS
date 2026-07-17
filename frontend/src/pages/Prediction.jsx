import { useState, useEffect } from 'react'
import { getPrediction } from '../api/backendApi'
import KPICard from '../components/KPICard'
export default function Prediction() {
  const [data, setData] = useState(null)
  useEffect(() => {
    const f = async () => { try { const r = await getPrediction(); if (r.success) setData(r.data) } catch {} }
    f(); const id = setInterval(f, 30000); return () => clearInterval(id)
  }, [])
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">🔮 Prediction</h1>
      {data ? (
        <div className="grid grid-cols-3 gap-4">
          <KPICard title="Current RPS" value={data.current_rps?.toFixed(2)} icon="📡" color="cyan" />
          <KPICard title="Recommended" value={data.recommended_replicas} unit="pods" icon="🐳" color="green" />
          <KPICard title="Method" value={data.method} icon="🧠" color="purple" />
        </div>
      ) : <p className="text-slate-500 text-center py-16">Wait 60s for first forecast...</p>}
    </div>
  )
}
