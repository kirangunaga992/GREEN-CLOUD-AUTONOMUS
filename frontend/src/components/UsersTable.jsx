import { useNavigate } from 'react-router-dom'

export default function UsersTable({ users, onlineCount }) {
  const navigate = useNavigate()

  if (!users || users.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        <p className="text-4xl mb-2">👤</p>
        <p>No users registered yet</p>
        <p className="text-xs mt-2">Share your Cloudflare URL for friends to sign up!</p>
      </div>
    )
  }

  const totalDevices = users.reduce((sum, u) => sum + (u.active_devices || 0), 0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-6 text-sm flex-wrap">
        <div className="text-slate-400">
          Registered: <span className="text-white font-bold">{users.length}</span>
        </div>
        <div className="text-slate-400">
          Online: <span className="text-green-400 font-bold">{onlineCount}</span>
        </div>
        <div className="text-slate-400">
          Total Devices: <span className="text-cyan-400 font-bold">{totalDevices}</span>
        </div>
        <div className="text-xs text-slate-500 italic ml-auto">
          💡 Click any user to see detailed activity
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700 text-xs uppercase">
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">Name</th>
              <th className="text-left py-3 px-3">Devices</th>
              <th className="text-right py-3 px-3">Requests</th>
              <th className="text-right py-3 px-3">Energy</th>
              <th className="text-right py-3 px-3">Carbon</th>
              <th className="text-right py-3 px-3">Cost</th>
              <th className="text-left py-3 px-3">Features Used</th>
              <th className="text-right py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.user_id || i}
                onClick={() => navigate(`/user/${user.user_id}`)}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition cursor-pointer group"
              >
                <td className="py-3 px-3">
                  {user.is_online ? (
                    <span className="inline-flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      Live
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-600 mr-2"></span>
                      Offline
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="text-white font-medium group-hover:text-green-400">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="py-3 px-3">
                  {user.active_devices > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                      📱 {user.active_devices}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">-</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right text-cyan-400 font-mono">{user.total_requests || 0}</td>
                <td className="py-3 px-3 text-right text-yellow-400 font-mono text-xs">
                  {(user.total_energy_kwh || 0).toFixed(6)} kWh
                </td>
                <td className="py-3 px-3 text-right text-red-400 font-mono text-xs">
                  {(user.total_carbon_kg || 0).toFixed(6)} kg
                </td>
                <td className="py-3 px-3 text-right text-green-400 font-mono">
                  ₹{(user.total_cost_inr || 0).toFixed(4)}
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(user.features_used || {}).map(([feat, count]) =>
                      count > 0 ? (
                        <span key={feat} className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          {featureIcon(feat)} {count}
                        </span>
                      ) : null
                    )}
                    {Object.values(user.features_used || {}).every(v => v === 0) && (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-slate-500 group-hover:text-green-400 text-lg">→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function featureIcon(feature) {
  const icons = {
    analytics: '📊',
    ai_compute: '🤖',
    file_storage: '🗄️',
    email: '📧',
    video: '🎬'
  }
  return icons[feature] || '⚙️'
}
