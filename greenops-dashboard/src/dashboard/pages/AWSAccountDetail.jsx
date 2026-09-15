import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiCloud, FiServer, FiDollarSign, FiZap, FiRefreshCw, FiArrowLeft, FiActivity, FiTrash2, FiExternalLink, FiTrendingUp, FiClock } from "react-icons/fi";
import ReactECharts from "echarts-for-react";

const API = "http://localhost:8000/api/cloud";

export default function AWSAccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [instances, setInstances] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("greenops_token");

  const loadAccount = async () => {
    try {
      const r = await fetch(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        // Find the specific account by decoded ARN
        const decoded = decodeURIComponent(accountId);
        const acc = d.accounts.find(a => a.role_arn === decoded);
        setAccount(acc);
      }
    } catch (e) { console.error(e); }
  };

  const loadInstances = async () => {
    try {
      const r = await fetch(`${API}/aws-instances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) {
        // Filter instances only for this account
        const decoded = decodeURIComponent(accountId);
        const filtered = {
          ...d,
          instances: (d.instances || []).filter(i => {
            // Match by account_name for now
            return account ? i.account_name === account.account_name : false;
          })
        };
        setInstances(filtered);
      }
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  useEffect(() => {
    if (account) {
      loadInstances();
      const interval = setInterval(loadInstances, 30000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const handleDelete = async () => {
    if (!confirm(`Disconnect ${account?.account_name}?`)) return;
    try {
      await fetch(`${API}/accounts/${encodeURIComponent(account.role_arn)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/cloud");
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <p className="text-center text-gray-500 py-20">Loading...</p>
      </div>
    </div>
  );

  if (!account) return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-8 text-center">
          <p className="text-gray-400 mb-4">Account not found</p>
          <button onClick={() => navigate("/cloud")} className="text-blueAccent">
            &larr; Back to Cloud Providers
          </button>
        </div>
      </div>
    </div>
  );

  const runningInstances = instances?.instances?.filter(i => i.state === "running") || [];
  const stoppedInstances = instances?.instances?.filter(i => i.state !== "running") || [];
  const totalCost = runningInstances.reduce((sum, i) => sum + (i.hourly_cost_usd || 0), 0);
  const totalCarbon = runningInstances.reduce((sum, i) => sum + (i.hourly_carbon_kg || 0), 0);

  // Cost by instance type chart
  const typeGroups = {};
  runningInstances.forEach(i => {
    if (!typeGroups[i.type]) typeGroups[i.type] = { count: 0, cost: 0 };
    typeGroups[i.type].count += 1;
    typeGroups[i.type].cost += i.hourly_cost_usd || 0;
  });

  const costChartOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    legend: { textStyle: { color: "#9ca3af" }, bottom: 0 },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      data: Object.entries(typeGroups).map(([type, data]) => ({
        value: data.cost.toFixed(4),
        name: `${type} (${data.count})`
      })),
      label: { color: "#e5e7eb" },
      itemStyle: {
        borderColor: "#0B0F14",
        borderWidth: 2
      }
    }]
  };

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">

          {/* Back Button */}
          <button
            onClick={() => navigate("/cloud")}
            className="text-blueAccent hover:text-blue-400 text-sm flex items-center gap-1"
          >
            <FiArrowLeft /> Back to All Accounts
          </button>

          {/* Account Header */}
          <div className="panel bg-gradient-to-br from-blueAccent/10 to-greenAccent/10 border-blueAccent/30">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-blueAccent/20 flex items-center justify-center">
                  <FiCloud className="text-blueAccent text-3xl" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{account.account_name}</h1>
                    <span className="px-2 py-1 rounded bg-greenAccent/20 text-greenAccent text-xs font-bold uppercase">
                      &bull; Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>Provider:</strong> AWS
                  </p>
                  <p className="text-xs text-gray-500 font-mono break-all">
                    {account.role_arn}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Region: {account.region} | Connected: {account.connected_at?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadInstances}
                  className="p-2 text-blueAccent hover:bg-blueAccent/10 rounded"
                  title="Refresh"
                >
                  <FiRefreshCw />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-redAccent hover:bg-redAccent/10 rounded"
                  title="Disconnect"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiServer className="text-greenAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Running Instances</p>
                  <p className="text-2xl font-bold text-white">{runningInstances.length}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiServer className="text-gray-400 text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Stopped</p>
                  <p className="text-2xl font-bold text-white">{stoppedInstances.length}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiDollarSign className="text-yellowAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Cost/Hour</p>
                  <p className="text-2xl font-bold text-white">${totalCost.toFixed(4)}</p>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="flex items-center gap-3">
                <FiZap className="text-redAccent text-3xl" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">CO&#8322;/Hour</p>
                  <p className="text-2xl font-bold text-white">{totalCarbon.toFixed(4)}kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Projections */}
          <div className="panel">
            <div className="panel-title">Monthly Projections</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-xs text-gray-400 mb-1">Estimated Monthly Cost</p>
                <p className="text-3xl font-bold text-yellowAccent">${(totalCost * 24 * 30).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Based on current usage</p>
              </div>
              <div className="p-4 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-xs text-gray-400 mb-1">Estimated Monthly Carbon</p>
                <p className="text-3xl font-bold text-redAccent">{(totalCarbon * 24 * 30).toFixed(2)}kg</p>
                <p className="text-[10px] text-gray-500 mt-1">CO&#8322; equivalent</p>
              </div>
              <div className="p-4 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-xs text-gray-400 mb-1">Potential Savings with GreenOps</p>
                <p className="text-3xl font-bold text-greenAccent">${(totalCost * 24 * 30 * 0.6).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 mt-1">60% via auto-scaling</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          {runningInstances.length > 0 && (
            <div className="panel">
              <div className="panel-title">Cost Distribution by Instance Type</div>
              <ReactECharts option={costChartOption} style={{ height: 300 }} />
            </div>
          )}

          {/* Instances Table */}
          <div className="panel">
            <div className="panel-title flex justify-between items-center">
              <span>EC2 Instances in {account.account_name}</span>
              <span className="text-greenAccent text-xs">{instances?.instances?.length || 0} total</span>
            </div>

            {!instances?.instances?.length ? (
              <div className="text-center py-8">
                <FiServer className="text-gray-600 text-5xl mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No EC2 instances found in this account</p>
                <p className="text-xs text-gray-500">Region: {account.region}</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-gray-400 uppercase border-b border-borderSubtle">
                      <th className="p-2">Instance</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">State</th>
                      <th className="p-2">Region</th>
                      <th className="p-2 text-right">Cost/hr</th>
                      <th className="p-2 text-right">CO&#8322;/hr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instances.instances.map((inst, i) => (
                      <tr key={i} className="border-b border-borderSubtle hover:bg-panel transition-colors">
                        <td className="p-2">
                          <p className="font-semibold text-white">{inst.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{inst.instance_id}</p>
                        </td>
                        <td className="p-2 text-gray-300">{inst.type}</td>
                        <td className="p-2">
                          <span className={"text-[10px] px-2 py-1 rounded uppercase font-bold " +
                            (inst.state === "running" 
                              ? "bg-greenAccent/20 text-greenAccent" 
                              : "bg-gray-700 text-gray-400")}>
                            &bull; {inst.state}
                          </span>
                        </td>
                        <td className="p-2 text-gray-300 text-xs">{inst.region}</td>
                        <td className="p-2 text-right text-yellowAccent font-mono">
                          ${inst.hourly_cost_usd}
                        </td>
                        <td className="p-2 text-right text-redAccent font-mono">
                          {inst.hourly_carbon_kg}kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Isolation Notice */}
          <div className="p-4 rounded bg-blueAccent/10 border border-blueAccent/30">
            <div className="flex items-start gap-3">
              <FiCloud className="text-blueAccent text-2xl mt-1" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Account Isolation</p>
                <p className="text-xs text-gray-300">
                  This page shows data ONLY from <strong className="text-blueAccent">{account.account_name}</strong>. 
                  Other AWS accounts you have connected will not be mixed here. Each account has its own dedicated view.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
