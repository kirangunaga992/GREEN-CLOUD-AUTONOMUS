import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiZap, FiActivity, FiAlertTriangle, FiCheckCircle, FiPower, FiPlay, FiPause, FiRefreshCw, FiMail, FiTrendingDown, FiTrendingUp, FiCpu, FiDollarSign, FiClock } from "react-icons/fi";

const API = "http://localhost:8000/api/autoscaler";

export default function AutoscalerPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [autoMode, setAutoMode] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("greenops_token");

  const analyze = async () => {
    setLoading(true);
    setMessage("Analyzing instances...");
    try {
      const r = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        setAnalysis(d);
        if (d.alerts_sent) {
          setMessage("✉️ Alert email sent to your inbox!");
        } else if (d.alerts?.length > 0) {
          setMessage(`⚠️ Found ${d.alerts.length} alerts`);
        } else {
          setMessage("✓ All instances healthy");
        }
      } else {
        setMessage("Error: " + (d.error || d.detail || "No AWS accounts connected for this user"));
      }
    } catch (e) {
      setMessage("Failed: " + e.message);
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const loadHistory = async () => {
    try {
      const r = await fetch(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setHistory(d);
    } catch (e) { console.error(e); }
  };

  const shutdownInstance = async (instance, accountName) => {
    if (!confirm(`Auto-shutdown ${instance}? This will stop the EC2 instance.`)) return;
    setActionLoading(instance);
    try {
      const r = await fetch(`${API}/execute-shutdown`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instance_id: instance, account_name: accountName })
      });
      const d = await r.json();
      if (d.success) {
        setMessage(`✅ Instance ${instance} stopped. Email sent!`);
        setTimeout(() => { analyze(); loadHistory(); }, 2000);
      } else {
        setMessage("Failed: " + d.error);
      }
    } catch (e) {
      setMessage("Error: " + e.message);
    }
    setActionLoading(null);
    setTimeout(() => setMessage(""), 5000);
  };

  const startInstance = async (instance, accountName) => {
    setActionLoading(instance);
    try {
      const r = await fetch(`${API}/execute-start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instance_id: instance, account_name: accountName })
      });
      const d = await r.json();
      if (d.success) {
        setMessage(`✅ Instance ${instance} starting...`);
        setTimeout(() => { analyze(); loadHistory(); }, 5000);
      } else {
        setMessage("Failed: " + d.error);
      }
    } catch (e) {
      setMessage("Error: " + e.message);
    }
    setActionLoading(null);
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    analyze();
    loadHistory();
  }, []);

  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(() => {
        analyze();
      }, 300000); // Every 5 min
      return () => clearInterval(interval);
    }
  }, [autoMode]);

  const idleInstances = analysis?.recommendations?.filter(r => r.recommendation === "shutdown") || [];
  const healthyInstances = analysis?.recommendations?.filter(r => r.recommendation === "healthy") || [];
  const highLoadInstances = analysis?.recommendations?.filter(r => r.recommendation === "scale_up") || [];
  const stoppedInstances = analysis?.recommendations?.filter(r => r.recommendation === "keep_stopped") || [];

  const totalSaving = idleInstances.reduce((sum, i) => sum + (i.potential_saving_monthly || 0), 0);
  const totalCarbon = idleInstances.reduce((sum, i) => sum + (i.carbon_saving_monthly_kg || 0), 0);

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiZap className="text-yellowAccent" />
                Smart Autoscaler
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Auto-shutdown idle instances • Auto-scale on demand • Email alerts
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/wake-guide")}
                className="px-4 py-2 rounded bg-purple-500 text-white font-semibold text-sm hover:bg-purple-600 flex items-center gap-2"
              >
                ⚡ Wake-on-Request Guide
              </button>
              <button
                onClick={() => setAutoMode(!autoMode)}
                className={"px-4 py-2 rounded font-semibold text-sm flex items-center gap-2 " +
                  (autoMode ? "bg-greenAccent text-black" : "bg-panel border border-borderSubtle text-white")}
              >
                {autoMode ? "🟢 Auto Mode ON" : "⚪ Auto Mode OFF"}
              </button>
              <button
                onClick={analyze}
                disabled={loading}
                className="px-4 py-2 rounded bg-blueAccent text-white font-semibold text-sm hover:bg-blue-600 flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Analyze Now
              </button>
            </div>
          </div>

          {message && (
            <div className={"p-4 rounded border " +
              (message.includes("✅") || message.includes("✓") || message.includes("✉️")
                ? "bg-greenAccent/10 border-greenAccent/30 text-greenAccent"
                : message.includes("⚠️") || message.includes("Error") || message.includes("Failed")
                ? "bg-redAccent/10 border-redAccent/30 text-redAccent"
                : "bg-blueAccent/10 border-blueAccent/30 text-blueAccent")}>
              {message}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="text-yellowAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Idle Instances</p>
                  <p className="text-2xl font-bold text-yellowAccent">{idleInstances.length}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-greenAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Healthy</p>
                  <p className="text-2xl font-bold text-greenAccent">{healthyInstances.length}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiTrendingUp className="text-redAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">High Load</p>
                  <p className="text-2xl font-bold text-redAccent">{highLoadInstances.length}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiPause className="text-gray-400 text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Stopped</p>
                  <p className="text-2xl font-bold text-gray-400">{stoppedInstances.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Potential Savings */}
          {idleInstances.length > 0 && (
            <div className="panel bg-gradient-to-br from-greenAccent/20 to-blueAccent/20 border-greenAccent/40">
              <div className="flex items-center gap-4">
                <FiDollarSign className="text-greenAccent text-5xl" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">💰 Potential Monthly Savings</h2>
                  <p className="text-3xl font-bold text-greenAccent">${totalSaving.toFixed(2)}</p>
                  <p className="text-sm text-gray-300 mt-1">
                    + {totalCarbon.toFixed(2)}kg CO₂ prevented
                  </p>
                </div>
                <button
                  onClick={() => idleInstances.forEach(i => shutdownInstance(i.instance_id, i.account))}
                  className="px-6 py-3 bg-redAccent text-white rounded font-bold hover:bg-red-600 flex items-center gap-2"
                >
                  <FiPower /> Stop All Idle
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {analysis?.alerts?.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FiAlertTriangle className="text-yellowAccent" /> Active Alerts
              </h3>
              <div className="space-y-2">
                {analysis.alerts.map((alert, i) => (
                  <div key={i} className={"p-3 rounded border-l-4 " +
                    (alert.severity === "critical" 
                      ? "border-redAccent bg-redAccent/10" 
                      : "border-yellowAccent bg-yellowAccent/10")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={"font-bold text-sm " +
                          (alert.severity === "critical" ? "text-redAccent" : "text-yellowAccent")}>
                          {alert.severity.toUpperCase()}: {alert.instance}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">💡 {alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-blueAccent/10 rounded text-xs text-blueAccent flex items-center gap-2">
                <FiMail /> Alert emails automatically sent to your registered email
              </div>
            </div>
          )}

          {/* Idle Instances - Action Required */}
          {idleInstances.length > 0 && (
            <div className="panel border-yellowAccent/40">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FiAlertTriangle className="text-yellowAccent" /> Idle Instances (Recommend Shutdown)
              </h3>
              <div className="space-y-2">
                {idleInstances.map((inst, i) => (
                  <div key={i} className="p-4 bg-yellowAccent/5 border border-yellowAccent/30 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{inst.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{inst.instance_id}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-gray-300">
                            <FiCpu className="inline" /> CPU: {inst.cpu_avg}%
                          </span>
                          <span className="text-gray-300">
                            <FiActivity className="inline" /> Network: {inst.network_kb}KB
                          </span>
                          <span className="text-greenAccent">
                            💰 Save: ${inst.potential_saving_monthly}/mo
                          </span>
                          <span className="text-greenAccent">
                            🌱 CO₂: -{inst.carbon_saving_monthly_kg}kg/mo
                          </span>
                        </div>
                        <p className="text-xs text-yellowAccent mt-2">💡 {inst.reason}</p>
                      </div>
                      <button
                        onClick={() => shutdownInstance(inst.instance_id, inst.account)}
                        disabled={actionLoading === inst.instance_id}
                        className="ml-4 px-4 py-2 bg-redAccent text-white rounded font-bold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        <FiPower />
                        {actionLoading === inst.instance_id ? "Stopping..." : "Stop Now"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthy Instances */}
          {healthyInstances.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FiCheckCircle className="text-greenAccent" /> Healthy Instances
              </h3>
              <div className="space-y-2">
                {healthyInstances.map((inst, i) => (
                  <div key={i} className="p-3 bg-greenAccent/5 border border-greenAccent/30 rounded flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{inst.name} ({inst.type})</p>
                      <p className="text-xs text-gray-400">CPU: {inst.cpu_avg}% | Region: {inst.region}</p>
                    </div>
                    <span className="text-greenAccent text-xs font-bold">✓ HEALTHY</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stopped Instances - Can Start */}
          {stoppedInstances.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FiPause className="text-gray-400" /> Stopped Instances
              </h3>
              <div className="space-y-2">
                {stoppedInstances.map((inst, i) => (
                  <div key={i} className="p-3 bg-gray-800/30 border border-gray-700 rounded flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{inst.name} ({inst.type})</p>
                      <p className="text-xs text-gray-400">{inst.reason}</p>
                    </div>
                    <button
                      onClick={() => startInstance(inst.instance_id, inst.account)}
                      disabled={actionLoading === inst.instance_id}
                      className="px-4 py-2 bg-greenAccent text-black rounded font-bold hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
                    >
                      <FiPlay />
                      {actionLoading === inst.instance_id ? "Starting..." : "Start Now"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action History */}
          {history?.actions?.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FiClock /> Recent Actions
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.actions.slice(0, 10).map((action, i) => (
                  <div key={i} className="p-2 bg-bgPrimary rounded border border-borderSubtle flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {action.action === "shutdown" ? 
                        <FiPower className="text-redAccent" /> : 
                        <FiPlay className="text-greenAccent" />}
                      <span className="text-sm text-white capitalize">{action.action}</span>
                      <span className="text-xs text-gray-400 font-mono">{action.instance_id}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(action.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded bg-blueAccent/10 border border-blueAccent/30">
            <div className="flex items-start gap-3">
              <FiZap className="text-blueAccent text-2xl mt-1" />
              <div>
                <p className="text-sm font-bold text-white mb-1">How GreenOps Autoscaler Works</p>
                <ul className="text-xs text-gray-300 space-y-1 mt-2">
                  <li>✓ Checks CPU & network usage every 5 minutes</li>
                  <li>✓ Idle detection: &lt;5% CPU for 15 minutes = idle</li>
                  <li>✓ Sends email alerts when instances are idle</li>
                  <li>✓ Auto-shutdown saves cost & carbon</li>
                  <li>✓ Scale-up alerts when CPU &gt; 80%</li>
                  <li>✓ Deployed web apps stay running when traffic exists</li>
                  <li>✓ Enable "Auto Mode" for hands-off management</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
