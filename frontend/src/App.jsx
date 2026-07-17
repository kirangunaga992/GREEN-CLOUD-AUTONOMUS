import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import UserDetail from './pages/UserDetail'
import UsersPage from './pages/UsersPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0e1a]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/user/:userId" element={<UserDetail />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#181B1F', color: '#e2e8f0', border: '1px solid #2c3235' } }} />
      </div>
    </BrowserRouter>
  )
}
