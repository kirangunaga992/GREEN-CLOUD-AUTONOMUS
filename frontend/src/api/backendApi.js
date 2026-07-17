import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5001'

const backendApi = axios.create({ baseURL: BACKEND_URL, timeout: 10000 })
const gatewayApi = axios.create({ baseURL: GATEWAY_URL, timeout: 10000 })

// Dashboard
export const getDashboardSummary = () => backendApi.get('/api/dashboard/summary').then(r => r.data)
export const getMetricsHistory = (limit = 50) => backendApi.get(`/api/metrics/history?limit=${limit}`).then(r => r.data)
export const getScalingEvents = (limit = 20) => backendApi.get(`/api/scaling/events?limit=${limit}`).then(r => r.data)
export const manualScale = (replicas, reason = 'manual') => backendApi.post('/api/scaling/manual', { replicas, reason }).then(r => r.data)
export const wakeupWorkload = () => backendApi.post('/api/scaling/wakeup').then(r => r.data)
export const getPrediction = () => backendApi.get('/api/prediction/forecast').then(r => r.data)
export const getSustainability = () => backendApi.get('/api/sustainability/summary').then(r => r.data)

// Users
export const getAllUsers = () => backendApi.get('/api/users/all').then(r => r.data)
export const getUserActivity = (userId, limit = 100) => 
  backendApi.get(`/api/users/${userId}/activity?limit=${limit}`).then(r => r.data)

// Sessions
export const startSession = () => gatewayApi.post('/api/session/start').then(r => r.data)
export const sendHeartbeat = (sid) => gatewayApi.post('/api/session/heartbeat', { session_id: sid }).then(r => r.data)
export const endSession = (sid) => gatewayApi.post('/api/session/end', { session_id: sid }).then(r => r.data)
