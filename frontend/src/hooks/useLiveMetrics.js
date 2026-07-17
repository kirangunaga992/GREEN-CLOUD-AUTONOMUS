import { useState, useEffect } from 'react'
import { getDashboardSummary, getMetricsHistory, getScalingEvents } from '../api/backendApi'
import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export function useLiveMetrics() {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [scalingEvents, setScaling] = useState([])
  const [users, setUsers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      const [sum, hist, events, usersRes] = await Promise.all([
        getDashboardSummary(),
        getMetricsHistory(30),
        getScalingEvents(10),
        axios.get(`${BACKEND}/api/users/all`).then(r => r.data).catch(() => ({ success: false, users: [], online_count: 0 }))
      ])
      if (sum.success) setSummary(sum.data)
      if (hist.success) setHistory(hist.data.reverse())
      if (events.success) setScaling(events.data)
      if (usersRes.success) {
        setUsers(usersRes.users)
        setOnlineCount(usersRes.online_count)
      }
      setError(null)
    } catch (err) {
      setError('Cannot reach backend. Is docker compose running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 2000)  // Poll every 2 seconds for real-time feel
    return () => clearInterval(id)
  }, [])

  return { summary, history, scalingEvents, users, onlineCount, error, loading }
}
