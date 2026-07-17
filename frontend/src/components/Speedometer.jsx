export default function Speedometer({ value, label, sublabel }) {
  // value 0-100, needle rotation from -90 to +90 degrees
  const rotation = (value / 100) * 180 - 90
  const color = value < 33 ? '#22c55e' : value < 66 ? '#eab308' : '#ef4444'
  const arcLength = 251  // Approx circumference of half circle with r=80
  const dashArray = `${(value / 100) * arcLength} ${arcLength}`

  return (
    <div className="text-center">
      <div style={{ position: 'relative', width: '180px', height: '120px', margin: '0 auto' }}>
        <svg width="180" height="120" viewBox="0 0 200 120">
          {/* Background arc (gray) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Colored arc (progress) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            style={{ transition: 'all 0.8s ease' }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const angle = (tick / 100) * 180 - 90
            const rad = (angle * Math.PI) / 180
            const x1 = 100 + Math.cos(rad) * 65
            const y1 = 100 + Math.sin(rad) * 65
            const x2 = 100 + Math.cos(rad) * 75
            const y2 = 100 + Math.sin(rad) * 75
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#475569"
                strokeWidth="2"
              />
            )
          })}

          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${rotation} 100 100)`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />

          {/* Center dot */}
          <circle cx="100" cy="100" r="8" fill="white" />
          <circle cx="100" cy="100" r="4" fill={color} />
        </svg>

        {/* Percentage value */}
        <div style={{
          position: 'absolute',
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '28px',
          fontWeight: '800',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)'
        }}>
          {Math.round(value)}%
        </div>
      </div>

      <div className="text-slate-400 text-xs uppercase tracking-wider mt-3">
        {label}
      </div>

      {sublabel && (
        <div style={{
          color,
          fontSize: '14px',
          fontWeight: 700,
          marginTop: '6px'
        }}>
          ● {sublabel}
        </div>
      )}
    </div>
  )
}
