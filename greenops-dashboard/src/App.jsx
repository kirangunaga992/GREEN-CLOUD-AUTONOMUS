import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./dashboard/hooks/useAuth";
import Dashboard from "./dashboard/Dashboard";
import InfrastructurePage from "./dashboard/pages/InfrastructurePage";
import UserDetailPage from "./dashboard/pages/UserDetailPage";
import LoginPage from "./dashboard/pages/LoginPage";
import SignupPage from "./dashboard/pages/SignupPage";
import ForgotPasswordPage from "./dashboard/pages/ForgotPasswordPage";
import ResetPasswordPage from "./dashboard/pages/ResetPasswordPage";
import GitHubCallback from "./dashboard/pages/GitHubCallback";
import CloudProvidersPage from "./dashboard/pages/CloudProvidersPage";
import InstallationPage from "./dashboard/pages/InstallationPage";
import AWSGuidePage from "./dashboard/pages/AWSGuidePage";
import AWSAccountDetail from "./dashboard/pages/AWSAccountDetail";
import AWSFullInventory from "./dashboard/pages/AWSFullInventory";
import AutoscalerPage from "./dashboard/pages/AutoscalerPage";
import WakeOnRequestGuide from "./dashboard/pages/WakeOnRequestGuide";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary text-white">
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/infrastructure" element={<ProtectedRoute><InfrastructurePage /></ProtectedRoute>} />
          <Route path="/cloud" element={<ProtectedRoute><CloudProvidersPage /></ProtectedRoute>} />
          <Route path="/install" element={<ProtectedRoute><InstallationPage /></ProtectedRoute>} />
          <Route path="/aws-guide" element={<ProtectedRoute><AWSGuidePage /></ProtectedRoute>} />
          <Route path="/cloud/account/:accountId" element={<ProtectedRoute><AWSAccountDetail /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><AWSFullInventory /></ProtectedRoute>} />
          <Route path="/autoscaler" element={<ProtectedRoute><AutoscalerPage /></ProtectedRoute>} />
          <Route path="/wake-guide" element={<ProtectedRoute><WakeOnRequestGuide /></ProtectedRoute>} />
          <Route path="/user/:userId" element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
