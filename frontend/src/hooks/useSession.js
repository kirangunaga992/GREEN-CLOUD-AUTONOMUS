import { useState, useEffect, useRef } from 'react'
import { startSession, sendHeartbeat, endSession } from '../api/backendApi'
import toast from 'react-hot-toast'

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const heartbeatRef = useRef(null)

  const start = async () => {
    try {
      const data = await startSession()
      setSessionId(data.session_id)
      setIsActive(true)
      heartbeatRef.current = setInterval(() => {
        sendHeartbeat(data.session_id).catch(() => {})
      }, 10000)
      toast.success(`Session started! Users: ${data.active_users}`)
    } catch { toast.error('Failed to start session') }
  }

  const stop = async () => {
    if (!sessionId) return
    clearInterval(heartbeatRef.current)
    try { await endSession(sessionId) } catch {}
    setSessionId(null)
    setIsActive(false)
    toast.success('Session ended')
  }

  useEffect(() => () => clearInterval(heartbeatRef.current), [])
  return { sessionId, isActive, start, stop }
}
