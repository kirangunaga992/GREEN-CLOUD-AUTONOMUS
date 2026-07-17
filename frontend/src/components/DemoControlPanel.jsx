import { useState } from 'react'
import { manualScale } from '../api/backendApi'
import { useSession } from '../hooks/useSession'
import toast from 'react-hot-toast'
import axios from 'axios'

const GW = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5001'

export default function DemoControlPanel() {
  const { sessionId, isActive, start, stop } = useSession()
  const [loading, setLoading] = useState('')

  const btn = async (label, fn) => {
    setLoading(label)
    try { await fn() } catch { toast.error(`${label} failed`) }
    finally { setLoading('') }
  }

  const sendTraffic = async (intensity, count) => {
    if (!sessionId) { toast.error('Start a session first'); return }
    await Promise.all(Array(count).fill(0).map(() =>
      axios.get(`${GW}/work?session_id=${sessionId}&intensity=${intensity}`).catch(() => {})
    ))
    toast.success(`Sent ${count} ${intensity} requests`)
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h2 className="text-white font-bold text-lg mb-1">�� Demo Control</h2>
      <p className="text-slate-400 text-sm mb-5">Use during viva demo</p>

      <div className="mb-5">
        <p className="text-xs text-slate-500 uppercase mb-2">Session</p>
        <div className="flex gap-3">
          <button onClick={() => btn('start', start)} disabled={isActive || loading==='start'}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white">
            ▶ Start
          </button>
          <button onClick={() => btn('stop', stop)} disabled={!isActive || loading==='stop'}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white">
            ⏹ End
          </button>
        </div>
        {sessionId && <p className="text-xs text-green-400 mt-2">✅ {sessionId.slice(0,8)}...</p>}
      </div>

      <div className="mb-5">
        <p className="text-xs text-slate-500 uppercase mb-2">Traffic</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => btn('l', () => sendTraffic('light', 3))} disabled={!isActive}
            className="py-2 rounded-lg text-sm bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white">🟢 Low</button>
          <button onClick={() => btn('m', () => sendTraffic('medium', 8))} disabled={!isActive}
            className="py-2 rounded-lg text-sm bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 text-white">🟡 Med</button>
          <button onClick={() => btn('h', () => sendTraffic('heavy', 15))} disabled={!isActive}
            className="py-2 rounded-lg text-sm bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white">🔴 High</button>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase mb-2">Manual Scale</p>
        <div className="grid grid-cols-4 gap-2">
          {[0,1,2,3].map(n => (
            <button key={n} onClick={() => btn(`s${n}`, () => manualScale(n))} disabled={!!loading}
              className="py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white">
              {n===0?'⛔':'🔵'} {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
