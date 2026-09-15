import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiLoader } from "react-icons/fi";

const API = (window.location.hostname === "localhost" ? "http://localhost:8000" : `${window.location.protocol}//${window.location.hostname}:8000`) + "/api/auth";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password })
      });
      const d = await r.json();
      if (d.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(d.error);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center bg-bgPrimary text-white">Invalid reset link</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-xl font-bold text-white">Set New Password</h1>
        </div>
        <div className="bg-panel border border-borderSubtle rounded-lg p-8 shadow-2xl">
          {success ? (
            <div className="text-center">
              <FiCheckCircle className="text-greenAccent text-5xl mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Password reset!</h2>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded bg-redAccent/10 border border-redAccent/30 text-sm text-redAccent">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} required
                      className="w-full pl-10 pr-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded bg-greenAccent hover:bg-green-500 text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><FiLoader className="animate-spin" /> Resetting...</> : "RESET PASSWORD"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
