import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiRefreshCw, FiGithub, FiAlertCircle, FiLoader } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

const API = (window.location.hostname === "localhost" ? "http://localhost:8000" : `${window.location.protocol}//${window.location.hostname}:8000`) + "/api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [captcha, setCaptcha] = useState({ id: "", question: "", answer: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCaptcha = async () => {
    try {
      const r = await fetch(`${API}/captcha`);
      const d = await r.json();
      setCaptcha({ id: d.captcha_id, question: d.question, answer: "" });
    } catch (e) {
      setError("Failed to load CAPTCHA");
    }
  };

  useEffect(() => { loadCaptcha(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, password,
          captcha_id: captcha.id,
          captcha_answer: captcha.answer
        })
      });
      const d = await r.json();
      if (d.success) {
        login(d.token, d.user);
        navigate("/");
      } else {
        setError(d.error || "Login failed");
        loadCaptcha();
      }
    } catch (e) {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  const handleGithub = async () => {
    try {
      const r = await fetch(`${API}/github/url`);
      const d = await r.json();
      window.location.href = d.url;
    } catch (e) {
      setError("GitHub login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4" style={{
      background: "radial-gradient(circle at 20% 30%, rgba(34,197,94,0.05), transparent 50%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.05), transparent 50%), #0B0F14"
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">GREENOPS AUTONOMOUS</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Sustainable Cloud Platform</p>
        </div>

        {/* Card */}
        <div className="bg-panel border border-borderSubtle rounded-lg p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to your admin dashboard</p>

          {error && (
            <div className="mb-4 p-3 rounded bg-redAccent/10 border border-redAccent/30 flex items-start gap-2">
              <FiAlertCircle className="text-redAccent mt-0.5 shrink-0" />
              <p className="text-sm text-redAccent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent transition-colors"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Security Check</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-bgPrimary border border-borderSubtle rounded px-3 py-2.5">
                  <span className="text-lg font-mono font-bold text-yellowAccent select-none">{captcha.question} = ?</span>
                  <button type="button" onClick={loadCaptcha} className="ml-auto text-gray-500 hover:text-white" title="Refresh">
                    <FiRefreshCw />
                  </button>
                </div>
                <input
                  type="number"
                  value={captcha.answer}
                  onChange={e => setCaptcha({ ...captcha, answer: e.target.value })}
                  required
                  className="w-20 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white text-center focus:outline-none focus:border-blueAccent"
                  placeholder="?"
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-greenAccent" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-blueAccent hover:text-blue-400">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded bg-greenAccent hover:bg-green-500 text-black font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><FiLoader className="animate-spin" /> Signing in...</> : "SIGN IN"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-borderSubtle"></div>
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-borderSubtle"></div>
          </div>

          {/* GitHub OAuth */}
          <button
            onClick={handleGithub}
            type="button"
            className="w-full py-2.5 rounded bg-bgPrimary border border-borderSubtle hover:border-blueAccent text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <FiGithub /> Continue with GitHub
          </button>

          {/* Signup Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/signup" className="text-greenAccent hover:text-green-400 font-semibold">Sign up</Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          © 2025 GreenOps Autonomous. Sustainable Cloud Platform.
        </p>
      </div>
    </div>
  );
}
