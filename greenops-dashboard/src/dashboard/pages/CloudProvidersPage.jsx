import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiCloud, FiTrash2, FiCheckCircle, FiAlertCircle, FiLoader, FiRefreshCw, FiExternalLink, FiServer, FiDollarSign, FiZap, FiCopy, FiArrowRight, FiShield, FiClock } from "react-icons/fi";
import Sidebar from "../Sidebar";
import Header from "../Header";

const API = "http://localhost:8000/api/cloud";

export default function CloudProvidersPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [instances, setInstances] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [setupLink, setSetupLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    account_name: "Production",
    role_arn: "",
    region: "us-east-1",
    external_id: ""
  });

  const token = localStorage.getItem("greenops_token");

  const loadAccounts = async () => {
    try {
      const r = await fetch(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setAccounts(d.accounts || []);
    } catch (e) { console.error(e); }
  };

  const loadInstances = async () => {
    try {
      const r = await fetch(`${API}/aws-instances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setInstances(d);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadAccounts();
    loadInstances();
    const id = setInterval(() => {
      loadAccounts();
      loadInstances();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const startWizard = async () => {
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/generate-setup-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        setSetupLink(d);
        setForm({...form, external_id: d.external_id});
        setShowWizard(true);
        setWizardStep(1);
      } else {
        setError(d.error);
      }
    } catch (e) {
      setError("Failed to generate setup link");
    }
    setLoading(false);
  };

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/connect-aws`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (d.success) {
        setSuccess("🎉 " + d.message);
        setShowWizard(false);
        setForm({ account_name: "Production", role_arn: "", region: "us-east-1", external_id: "" });
        loadAccounts();
        loadInstances();
      } else {
        setError(d.error);
      }
    } catch (e) {
      setError("Connection failed: " + e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (arn) => {
    if (!confirm("Disconnect this AWS account?")) return;
    try {
      await fetch(`${API}/accounts/${encodeURIComponent(arn)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadAccounts();
      loadInstances();
    } catch (e) { console.error(e); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("✅ Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <FiCloud className="text-blueAccent" />
                Cloud Providers
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Connect your AWS account with one click — no coding required
              </p>
            </div>
            <button
              onClick={() => navigate("/aws-guide")}
              className="px-4 py-2.5 rounded bg-blueAccent text-white font-semibold text-sm hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              📖 View Setup Guide
            </button>
            <button
              onClick={startWizard}
              disabled={loading}
              className="px-6 py-2.5 rounded bg-greenAccent text-black font-bold text-sm hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg shadow-greenAccent/20"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiPlus />}
              Add AWS Account
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded bg-redAccent/10 border border-redAccent/30 flex items-start gap-3">
              <FiAlertCircle className="text-redAccent mt-0.5 shrink-0" />
              <p className="text-sm text-redAccent flex-1">{error}</p>
              <button onClick={() => setError("")} className="text-gray-500 hover:text-white">✕</button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded bg-greenAccent/10 border border-greenAccent/30 flex items-start gap-3">
              <FiCheckCircle className="text-greenAccent mt-0.5 shrink-0" />
              <p className="text-sm text-greenAccent flex-1">{success}</p>
              <button onClick={() => setSuccess("")} className="text-gray-500 hover:text-white">✕</button>
            </div>
          )}

          {/* Wizard Modal */}
          {showWizard && setupLink && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-panel border border-borderSubtle rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-borderSubtle flex justify-between items-center bg-gradient-to-r from-blueAccent/10 to-greenAccent/10">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FiCloud className="text-blueAccent" />
                      Connect AWS - One-Click Setup
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Follow these simple steps (no coding required)</p>
                  </div>
                  <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-3 border-b border-borderSubtle">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                      <div key={s} className="flex-1">
                        <div className={"h-1.5 rounded " + (wizardStep >= s ? "bg-greenAccent" : "bg-borderSubtle")} />
                        <p className={"text-[10px] mt-1 uppercase tracking-wider " + (wizardStep >= s ? "text-greenAccent font-bold" : "text-gray-500")}>
                          Step {s}: {s === 1 ? "Launch AWS" : s === 2 ? "Get ARN" : "Connect"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 1: Launch AWS */}
                {wizardStep === 1 && (
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <div className="text-5xl mb-3">🚀</div>
                      <h3 className="text-lg font-bold text-white mb-2">Launch AWS Setup</h3>
                      <p className="text-sm text-gray-400 mb-6">
                        Click the button below to open AWS Console with everything pre-configured.
                        You'll just need to click "Create stack" — AWS will handle the rest automatically.
                      </p>
                    </div>

                    <div className="bg-bgPrimary p-4 rounded border border-borderSubtle">
                      <div className="flex items-start gap-3">
                        <FiShield className="text-greenAccent text-xl mt-0.5" />
                        <div className="text-xs text-gray-300">
                          <p className="font-semibold text-white mb-1">100% Secure - Read-Only Access</p>
                          <p>• Uses AWS CloudFormation (official method)</p>
                          <p>• Creates read-only IAM role in YOUR account</p>
                          <p>• Uses ExternalId for extra security</p>
                          <p>• You can revoke access anytime</p>
                        </div>
                      </div>
                    </div>

                    <a
                      href={setupLink.launch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setTimeout(() => setWizardStep(2), 2000)}
                      className="block w-full py-4 rounded bg-gradient-to-r from-blueAccent to-greenAccent text-white font-bold text-center text-lg hover:opacity-90 transition-all shadow-lg"
                    >
                      �� Launch AWS Setup (Opens New Tab)
                    </a>

                    <div className="text-center text-xs text-gray-500 mt-4">
                      <p className="mb-2">This will open AWS Console. You'll:</p>
                      <div className="flex justify-center gap-4 text-[11px]">
                        <span>✅ Login to AWS</span>
                        <span>✅ Click "Create stack"</span>
                        <span>✅ Wait 30 sec</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setWizardStep(2)}
                      className="w-full py-2 text-blueAccent hover:text-blue-400 text-sm underline"
                    >
                      I've already created the stack → Next step
                    </button>
                  </div>
                )}

                {/* Step 2: Get ARN */}
                {wizardStep === 2 && (
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <div className="text-5xl mb-3">📋</div>
                      <h3 className="text-lg font-bold text-white mb-2">Copy Your Role ARN</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        After AWS finishes creating the stack (30 seconds), go to the "Outputs" tab
                      </p>
                    </div>

                    <div className="bg-bgPrimary p-4 rounded border border-borderSubtle space-y-3">
                      <p className="text-sm text-white font-semibold mb-2">In AWS Console:</p>
                      <div className="space-y-2 text-xs text-gray-300 pl-4">
                        <p>1. Wait for stack status: <span className="text-greenAccent font-mono">CREATE_COMPLETE</span></p>
                        <p>2. Click the <strong className="text-white">"Outputs"</strong> tab</p>
                        <p>3. Find the row: <span className="text-blueAccent font-mono">RoleArn</span></p>
                        <p>4. Copy the value (starts with <code className="text-yellowAccent">arn:aws:iam::</code>)</p>
                      </div>
                    </div>

                    <div className="bg-blueAccent/5 border border-blueAccent/30 rounded p-3">
                      <p className="text-xs text-blueAccent flex items-center gap-2">
                        <FiClock /> Typically takes 30-60 seconds. If stack failed, try again with launch link.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="flex-1 py-2.5 rounded bg-panel border border-borderSubtle text-white text-sm hover:border-blueAccent"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setWizardStep(3)}
                        className="flex-1 py-2.5 rounded bg-blueAccent text-white text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        I have the ARN <FiArrowRight />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Connect */}
                {wizardStep === 3 && (
                  <div className="p-6 space-y-4">
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">🔗</div>
                      <h3 className="text-lg font-bold text-white mb-2">Connect Your AWS Account</h3>
                      <p className="text-sm text-gray-400">Paste your Role ARN below to complete setup</p>
                    </div>
                    
                    <div className="p-3 bg-greenAccent/10 border border-greenAccent/30 rounded mb-4">
                      <div className="flex items-start gap-2">
                        <FiShield className="text-greenAccent text-lg mt-0.5" />
                        <div className="text-xs text-gray-300">
                          <p className="font-bold text-greenAccent mb-1">🔒 100% Secure - No Passwords Needed</p>
                          <p>You only paste the <strong className="text-white">Role ARN</strong>. Never share:</p>
                          <ul className="mt-1 ml-4 list-disc">
                            <li>AWS Access Keys ❌</li>
                            <li>AWS Password ❌</li>
                            <li>Root credentials ❌</li>
                          </ul>
                          <p className="mt-1">GreenOps uses AWS STS to assume your role securely.</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleConnect} className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Account Name</label>
                        <input
                          type="text"
                          value={form.account_name}
                          onChange={e => setForm({...form, account_name: e.target.value})}
                          required
                          className="w-full px-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                          placeholder="Production, Staging, Dev..."
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                          IAM Role ARN <span className="text-redAccent">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.role_arn}
                          onChange={e => setForm({...form, role_arn: e.target.value})}
                          required
                          className="w-full px-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white font-mono focus:outline-none focus:border-blueAccent"
                          placeholder="arn:aws:iam::123456789012:role/GreenOpsReadOnlyRole"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">AWS Region</label>
                        <select
                          value={form.region}
                          onChange={e => setForm({...form, region: e.target.value})}
                          className="w-full px-3 py-2.5 bg-bgPrimary border border-borderSubtle rounded text-sm text-white focus:outline-none focus:border-blueAccent"
                        >
                          <option value="us-east-1">US East (N. Virginia)</option>
                          <option value="us-west-2">US West (Oregon) 🌱 Green</option>
                          <option value="eu-west-1">EU (Ireland)</option>
                          <option value="eu-north-1">EU (Stockholm) 🌱 Greenest</option>
                          <option value="ap-south-1">Asia (Mumbai)</option>
                          <option value="ap-southeast-1">Asia (Singapore)</option>
                        </select>
                      </div>

                      <div className="bg-bgPrimary p-3 rounded border border-borderSubtle">
                        <p className="text-[10px] text-gray-400 mb-1">External ID (auto-generated)</p>
                        <p className="text-xs text-gray-300 font-mono break-all">{form.external_id}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="flex-1 py-2.5 rounded bg-panel border border-borderSubtle text-white text-sm hover:border-blueAccent"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2.5 rounded bg-greenAccent text-black font-bold text-sm hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading ? <><FiLoader className="animate-spin" /> Connecting...</> : <><FiCheckCircle /> Connect AWS</>}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div className="panel">
            <div className="panel-title flex justify-between items-center">
              <span>Connected Cloud Accounts</span>
              <span className="text-greenAccent text-xs">{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</span>
            </div>
            
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <FiCloud className="text-gray-600 text-5xl mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No cloud accounts connected yet</p>
                <p className="text-xs text-gray-500 mb-4">Connect in 3 clicks — no coding required</p>
                <button
                  onClick={startWizard}
                  className="px-6 py-2.5 rounded bg-greenAccent text-black font-bold hover:bg-green-500 inline-flex items-center gap-2"
                >
                  <FiPlus /> Connect Your First AWS Account
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {accounts.map((acc, i) => (
                  <div key={i} onClick={() => navigate(`/cloud/account/${encodeURIComponent(acc.role_arn)}`)} className="cursor-pointer flex items-center justify-between p-3 bg-bgPrimary rounded border border-borderSubtle hover:border-blueAccent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-blueAccent/20 flex items-center justify-center">
                        <FiCloud className="text-blueAccent text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{acc.account_name}</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate max-w-md">{acc.role_arn}</p>
                        <p className="text-[10px] text-gray-400">Region: {acc.region} • Connected: {acc.connected_at?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-greenAccent/20 text-greenAccent uppercase font-bold">
                        ● Active
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(acc.role_arn); }}
                        className="p-2 text-redAccent hover:bg-redAccent/10 rounded transition-colors"
                        title="Disconnect"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AWS Instances */}
          {instances && instances.instances && instances.instances.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card"><div className="flex items-center gap-3"><FiServer className="text-greenAccent text-2xl" /><div><p className="text-[10px] text-gray-400 uppercase">Running</p><p className="text-2xl font-bold text-white">{instances.total_running}</p></div></div></div>
                <div className="kpi-card"><div className="flex items-center gap-3"><FiDollarSign className="text-yellowAccent text-2xl" /><div><p className="text-[10px] text-gray-400 uppercase">Monthly Cost</p><p className="text-2xl font-bold text-white">${instances.total_monthly_cost}</p></div></div></div>
                <div className="kpi-card"><div className="flex items-center gap-3"><FiZap className="text-redAccent text-2xl" /><div><p className="text-[10px] text-gray-400 uppercase">Monthly Carbon</p><p className="text-2xl font-bold text-white">{instances.total_monthly_carbon}kg</p></div></div></div>
                <div className="kpi-card"><div className="flex items-center gap-3"><FiCloud className="text-blueAccent text-2xl" /><div><p className="text-[10px] text-gray-400 uppercase">Total</p><p className="text-2xl font-bold text-white">{instances.instances.length}</p></div></div></div>
              </div>

              <div className="panel">
                <div className="panel-title flex justify-between items-center">
                  <span>Your AWS EC2 Instances (Live)</span>
                  <button onClick={loadInstances} className="text-blueAccent text-sm hover:text-blue-400 flex items-center gap-1">
                    <FiRefreshCw /> Refresh
                  </button>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase border-b border-borderSubtle text-left">
                        <th className="p-2">Instance</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">State</th>
                        <th className="p-2">Region</th>
                        <th className="p-2 text-right">Cost/hr</th>
                        <th className="p-2 text-right">Carbon/hr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instances.instances.map((inst, i) => (
                        <tr key={i} className="border-b border-borderSubtle hover:bg-panel">
                          <td className="p-2">
                            <p className="font-semibold text-white">{inst.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{inst.instance_id}</p>
                          </td>
                          <td className="p-2 text-gray-300">{inst.type}</td>
                          <td className="p-2">
                            <span className={"text-[10px] px-2 py-1 rounded uppercase font-bold " +
                              (inst.state === "running" ? "bg-greenAccent/20 text-greenAccent" : "bg-gray-700 text-gray-400")}>
                              ● {inst.state}
                            </span>
                          </td>
                          <td className="p-2 text-gray-300 text-xs">{inst.region}</td>
                          <td className="p-2 text-right text-yellowAccent font-mono">${inst.hourly_cost_usd}</td>
                          <td className="p-2 text-right text-redAccent font-mono">{inst.hourly_carbon_kg} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
