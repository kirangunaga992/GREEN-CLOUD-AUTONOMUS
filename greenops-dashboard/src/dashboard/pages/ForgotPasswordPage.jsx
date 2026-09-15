import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle, FiLoader } from "react-icons/fi";

const API = (window.location.hostname === "localhost" ? "http://localhost:8000" : `${window.location.protocol}//${window.location.hostname}:8000`) + "/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const d = await r.json();
      if (d.success) setSent(true);
      else setError(d.error);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
        </div>
        <div className="bg-panel border border-borderSubtle rounded-lg p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <FiCheckCircle className="text-greenAccent text-5xl mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
              <p className="text-sm text-gray-400 mb-6">We sent a password reset link to <strong className="text-white">{email}</strong></p>
              <Link to="/login" className="text-blueAccent hover:text-blue-400 text-sm">← Back to Sign In</Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Forgot your password?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
              {error && <div className="mb-4 p-3 rounded bg-redAccent/10 border border-redAccent/30 text-sm text-redAccent">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-10 pr-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                    placeholder="you@company.com" autoFocus />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded bg-greenAccent hover:bg-green-500 text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><FiLoader className="animate-spin" /> Sending...</> : "SEND RESET LINK"}
                </button>
              </form>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-blueAccent hover:text-blue-400">
                <FiArrowLeft /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
