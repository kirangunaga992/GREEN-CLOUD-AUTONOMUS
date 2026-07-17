export default function StatusBadge({ status }) {
  const isOn = status === 'ON'
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
      isOn ? 'bg-green-500/20 border border-green-500 text-green-400'
           : 'bg-red-500/20 border border-red-500 text-red-400'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      Workload {status}
    </div>
  )
}
