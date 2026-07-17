import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
]

export default function Navbar() {
  const location = useLocation()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <nav className="bg-[#0a0e1a] border-b border-[#1e293b] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">

        {/* LEFT: Logo + Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-green-500/30">
              G
            </div>
            <div>
              <div className="text-white text-base font-bold leading-none">GreenOps</div>
              <div className="text-[10px] text-slate-500 leading-none mt-1 tracking-widest">CLOUD PLATFORM</div>
            </div>
          </Link>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-800"></div>

          {/* Environment Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md text-xs text-green-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            PRODUCTION
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-800"></div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  location.pathname === link.to
                    ? 'text-white bg-slate-800/70 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">

          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>All systems operational</span>
          </div>

          <div className="w-px h-6 bg-slate-800"></div>

          {/* Notifications */}
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-slate-800/50 rounded-md transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
              <div className="text-left">
                <div className="text-white text-xs font-semibold">Admin</div>
                <div className="text-[10px] text-slate-500">admin@greenops.io</div>
              </div>
            </button>

            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#181B1F] border border-[#2c3235] rounded-lg shadow-xl py-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white">
                  <span>⚙️</span> Settings
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white">
                  <span>🔑</span> API Keys
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white">
                  <span>📚</span> Documentation
                </button>
                <div className="border-t border-[#2c3235] my-1"></div>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                  <span>🚪</span> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
