export default function ActivityHeatmap({ data }) {
  // Generate 7 days x 24 hours grid
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Generate realistic pattern data if not provided
  const generateData = () => {
    const grid = []
    days.forEach((day, dIdx) => {
      for (let h = 0; h < 24; h++) {
        let value = 0
        // Business hours pattern
        if (h >= 9 && h <= 18) {
          value = Math.floor(Math.random() * 100)
          if (h >= 12 && h <= 15) value = Math.floor(60 + Math.random() * 40) // Peak
        } else if (h >= 7 && h <= 22) {
          value = Math.floor(Math.random() * 40)
        } else {
          value = Math.floor(Math.random() * 15)
        }
        grid.push({ day, hour: h, value })
      }
    })
    return grid
  }

  const heatmapData = data || generateData()

  const getColor = (value) => {
    if (value < 10) return 'rgba(30, 41, 59, 0.6)'
    if (value < 25) return 'rgba(59, 130, 246, 0.4)'
    if (value < 50) return 'rgba(59, 130, 246, 0.7)'
    if (value < 75) return 'rgba(239, 68, 68, 0.6)'
    return 'rgba(239, 68, 68, 0.9)'
  }

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '30px repeat(24, 1fr)', gap: '3px' }}>
        {/* Empty corner + hour labels */}
        <div></div>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-slate-500 text-[9px] text-center">
            {h % 6 === 0 ? h : ''}
          </div>
        ))}

        {/* Days + cells */}
        {days.map(day => (
          <>
            <div key={day} className="text-slate-500 text-[10px] flex items-center justify-end pr-1">
              {day}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = heatmapData.find(d => d.day === day && d.hour === h)
              const value = cell ? cell.value : 0
              return (
                <div
                  key={`${day}-${h}`}
                  className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125 hover:z-10 relative"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${day} ${h}:00 - ${value} events`}
                />
              )
            })}
          </>
        ))}
      </div>

      <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(30, 41, 59, 0.6)' }}></div>
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(59, 130, 246, 0.4)' }}></div>
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(59, 130, 246, 0.7)' }}></div>
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.6)' }}></div>
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.9)' }}></div>
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
