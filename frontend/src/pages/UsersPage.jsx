import { useLiveMetrics } from '../hooks/useLiveMetrics'
import UsersTable from '../components/UsersTable'
import DemoControlPanel from '../components/DemoControlPanel'

export default function UsersPage() {
  const { users, onlineCount, loading } = useLiveMetrics()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-6xl animate-pulse">👥</div>
    </div>
  )

  const totalRequests = users.reduce((s, u) => s + (u.total_requests || 0), 0)
  const totalRevenue = users.reduce((s, u) => s + (u.total_cost_inr || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and monitor all registered users</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/5 border border-blue-500/30 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Users</div>
          <div className="text-4xl font-bold text-white mt-2">{users.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/30 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Online Now</div>
          <div className="text-4xl font-bold text-green-400 mt-2">{onlineCount}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/5 border border-purple-500/30 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Requests</div>
          <div className="text-4xl font-bold text-purple-400 mt-2">{totalRequests}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/5 border border-orange-500/30 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Revenue</div>
          <div className="text-4xl font-bold text-orange-400 mt-2">₹{totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Users Table + Demo Panel */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-gradient-to-br from-[#151922] to-[#0f1420] border border-[#2c3543] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2c3543]">
              <div className="text-white text-base font-bold">Registered Users</div>
              <div className="text-xs text-slate-500 mt-1">Click any user for detailed activity</div>
            </div>
            <div className="p-4">
              <UsersTable users={users} onlineCount={onlineCount}/>
            </div>
          </div>
        </div>
        <div className="col-span-4">
          <DemoControlPanel/>
        </div>
      </div>
    </div>
  )
}
