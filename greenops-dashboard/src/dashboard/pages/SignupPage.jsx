import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiRefreshCw, FiGithub, FiAlertCircle, FiLoader, FiBriefcase, FiCheck } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

const API = (window.location.hostname === "localhost" ? "http://localhost:8000" : `${window.location.protocol}//${window.location.hostname}:8000`) + "/api/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountType, setAccountType] = useState("personal");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [captcha, setCaptcha] = useState({ id: "", question: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = (pw) => {
    if (pw.length < 6) return { level: 0, label: "Too short", color: "bg-redAccent" };
    if (pw.length < 8) return { level: 1, label: "Weak", color: "bg-redAccent" };
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { level: 2, label: "Medium", color: "bg-yellowAccent" };
    if (pw.length >= 10 && /[!@#$%^&*]/.test(pw)) return { level: 4, label: "Strong", color: "bg-greenAccent" };
    return { level: 3, label: "Good", color: "bg-blueAccent" };
  };

  const strength = passwordStrength(password);

  const loadCaptcha = async () => {
    try {
      const r = await fetch(`${API}/captcha`);
      const d = await r.json();
      setCaptcha({ id: d.captcha_id, question: d.question, answer: "" });
    } catch {}
  };

  useEffect(() => { loadCaptcha(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) { setError("Please accept Terms & Conditions"); return; }
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, role,
          account_type: accountType,
          company_name: companyName,
          captcha_id: captcha.id,
          captcha_answer: captcha.answer
        })
      });
      const d = await r.json();
      if (d.success) {
        login(d.token, d.user);
        navigate("/");
      } else {
        setError(d.error || "Signup failed");
        loadCaptcha();
      }
    } catch (e) {
      setError("Network error");
    }
    setLoading(false);
  };

  const handleGithub = async () => {
    try {
      const r = await fetch(`${API}/github/url`);
      const d = await r.json();
      window.location.href = d.url;
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4 py-8" style={{
      background: "radial-gradient(circle at 20% 30%, rgba(34,197,94,0.05), transparent 50%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.05), transparent 50%), #0B0F14"
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-xl font-bold text-white tracking-wide">GREENOPS AUTONOMOUS</h1>
        </div>

        <div className="bg-panel border border-borderSubtle rounded-lg p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
          <p className="text-sm text-gray-400 mb-4">Start your sustainable cloud journey</p>

          {error && (
            <div className="mb-3 p-2.5 rounded bg-redAccent/10 border border-redAccent/30 flex items-start gap-2">
              <FiAlertCircle className="text-redAccent mt-0.5 shrink-0" />
              <p className="text-xs text-redAccent">{error}</p>
            </div>
          )}

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-bgPrimary rounded border border-borderSubtle">
            <button
              type="button"
              onClick={() => setAccountType("personal")}
              className={"py-2 rounded text-sm font-semibold flex items-center justify-center gap-2 transition-all " +
                (accountType === "personal" ? "bg-greenAccent text-black" : "text-gray-400 hover:text-white")}
            >
              <FiUser /> Personal
            </button>
            <button
              type="button"
              onClick={() => setAccountType("company")}
              className={"py-2 rounded text-sm font-semibold flex items-center justify-center gap-2 transition-all " +
                (accountType === "company" ? "bg-greenAccent text-black" : "text-gray-400 hover:text-white")}
            >
              <FiBriefcase /> Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {accountType === "company" && (
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Company Name</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">
                {accountType === "company" ? "Your Full Name" : "Full Name"}
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">
                {accountType === "company" ? "Work Email" : "Email"}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                  placeholder={accountType === "company" ? "john@acme.com" : "you@example.com"}
                />
              </div>
            </div>

            {accountType === "company" && (
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Role (Optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                  placeholder="CTO, DevOps Lead, etc."
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={"h-1 flex-1 rounded " + (i <= strength.level ? strength.color : "bg-borderSubtle")}></div>
                    ))}
                  </div>
                  <p className={"text-[10px] " + strength.color.replace("bg-", "text-")}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Security Check</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-bgPrimary border border-borderSubtle rounded px-3 py-2">
                  <span className="text-base font-mono font-bold text-yellowAccent">{captcha.question} = ?</span>
                  <button type="button" onClick={loadCaptcha} className="ml-auto text-gray-500 hover:text-white">
                    <FiRefreshCw />
                  </button>
                </div>
                <input
                  type="number"
                  value={captcha.answer}
                  onChange={e => setCaptcha({...captcha, answer: e.target.value})}
                  required
                  className="w-16 py-2 bg-bgPrimary border border-borderSubtle rounded text-sm text-white text-center focus:outline-none focus:border-blueAccent"
                  placeholder="?"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="accent-greenAccent mt-0.5" />
              <span>I agree to the <span className="text-blueAccent">Terms of Service</span> and <span className="text-blueAccent">Privacy Policy</span></span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded bg-greenAccent hover:bg-green-500 text-black font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><FiLoader className="animate-spin" /> Creating account...</> : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-borderSubtle"></div>
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-borderSubtle"></div>
          </div>

          <button onClick={handleGithub} type="button"
            className="w-full py-2.5 rounded bg-bgPrimary border border-borderSubtle hover:border-blueAccent text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all">
            <FiGithub /> Continue with GitHub
          </button>

          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-greenAccent hover:text-green-400 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
