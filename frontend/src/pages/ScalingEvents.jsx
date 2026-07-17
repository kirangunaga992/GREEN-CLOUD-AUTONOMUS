import { useLiveMetrics } from '../hooks/useLiveMetrics'
import ScalingEventsTable from '../components/ScalingEventsTable'
export default function ScalingEvents() {
  const { scalingEvents } = useLiveMetrics()
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">⚖️ Scaling Events</h1>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <ScalingEventsTable events={scalingEvents} />
      </div>
    </div>
  )
}
