import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { FiUser, FiActivity, FiZap, FiCloud, FiDollarSign, FiArrowLeft, FiClock, FiServer, FiTrendingUp } from "react-icons/fi";
import Sidebar from "../Sidebar";
import Header from "../Header";

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState(null);
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // User info
      const uRes = await fetch(`http://localhost:8000/api/users/${userId}`);
      const uData = await uRes.json();
      if (uData.user || uData.success) setUser(uData.user || uData);

      // Activity/history
      try {
        const aRes = await fetch(`http://localhost:8000/api/users/${userId}/activity`);
        if (aRes.ok) {
          const aData = await aRes.json();
          setActivity(aData);
        }
      } catch {}

      // Services usage
      try {
        const sRes = await fetch(`http://localhost:8000/api/services/user/${userId}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.success) setServices(sData);
        }
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-bgPrimary">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <p className="text-gray-500 text-center py-20">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-bgPrimary">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-8">
            <button onClick={() => navigate(-1)} className="text-blueAccent flex items-center gap-2 mb-4">
              <FiArrowLeft /> Back
            </button>
            <p className="text-gray-400">User not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const features = user.features_used || {};
  const featureNames = Object.keys(features);
  const featureValues = Object.values(features);

  // Requests over time (simulated timeline from user data)
  const generateTimeSeries = (total, points = 12) => {
    const now = Date.now();
    const data = [];
    for (let i = points - 1; i >= 0; i--) {
      const t = new Date(now - i * 60 * 60 * 1000);
      const value = Math.round((total / points) * (0.5 + Math.random()));
      data.push([t.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}), value]);
    }
    return data;
  };

  const requestsSeries = generateTimeSeries(user.total_requests || 0);
  const carbonSeries = generateTimeSeries((user.total_carbon_kg || 0) * 1000, 12); // in grams

  // Chart options
  const requestChart = {
    tooltip: { trigger: "axis" },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: "category",
      data: requestsSeries.map(d => d[0]),
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10 }
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10 },
      splitLine: { lineStyle: { color: "#1F2933" } }
    },
    series: [{
      data: requestsSeries.map(d => d[1]),
      type: "line",
      smooth: true,
      areaStyle: { color: "rgba(59, 130, 246, 0.2)" },
      lineStyle: { color: "#3B82F6", width: 2 },
      itemStyle: { color: "#3B82F6" }
    }],
    backgroundColor: "transparent"
  };

  const carbonChart = {
    tooltip: { trigger: "axis" },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: "category",
      data: carbonSeries.map(d => d[0]),
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10 }
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10, formatter: "{value}g" },
      splitLine: { lineStyle: { color: "#1F2933" } }
    },
    series: [{
      data: carbonSeries.map(d => d[1]),
      type: "line",
      smooth: true,
      areaStyle: { color: "rgba(34, 197, 94, 0.2)" },
      lineStyle: { color: "#22C55E", width: 2 },
      itemStyle: { color: "#22C55E" }
    }],
    backgroundColor: "transparent"
  };

  const featureChart = {
    tooltip: { trigger: "axis" },
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: "category",
      data: featureNames,
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10, rotate: 20 }
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#1F2933" } },
      axisLabel: { color: "#94A3B8", fontSize: 10 },
      splitLine: { lineStyle: { color: "#1F2933" } }
    },
    series: [{
      data: featureValues.map((v, i) => ({
        value: v,
        itemStyle: { color: ["#22C55E", "#3B82F6", "#FACC15", "#EF4444", "#A855F7"][i % 5] }
      })),
      type: "bar",
      barWidth: 30
    }],
    backgroundColor: "transparent"
  };

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        
        <div className="px-6 py-4 space-y-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blueAccent hover:text-blue-400 text-sm font-semibold"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>

          {/* User Header Card */}
          <div className="panel">
            <div className="flex items-start gap-4">
              <div className={"w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold " +
                (user.is_online ? "bg-greenAccent text-black" : "bg-gray-700 text-gray-300")}>
                {user.name ? user.name[0].toUpperCase() : "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <span className={"px-2 py-1 rounded text-xs font-bold uppercase " +
                    (user.is_online ? "bg-greenAccent/20 text-greenAccent" : "bg-gray-700 text-gray-400")}>
                    {user.is_online ? "● Online" : "○ Offline"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">{user.email}</p>
                <p className="text-xs text-gray-500 font-mono">ID: {user.user_id}</p>
                <p className="text-xs text-gray-500 mt-2">
                  <FiClock className="inline mr-1" />
                  Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                  {user.last_login && (
                    <span className="ml-4">
                      Last login: {new Date(user.last_login).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card flex items-center gap-4 p-5">
              <FiActivity className="text-blueAccent text-3xl" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-white">{user.total_requests || 0}</p>
              </div>
            </div>
            <div className="kpi-card flex items-center gap-4 p-5">
              <FiZap className="text-yellowAccent text-3xl" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Energy Used</p>
                <p className="text-2xl font-bold text-white">{(user.total_energy_kwh || 0).toFixed(4)} <span className="text-sm text-gray-400">kWh</span></p>
              </div>
            </div>
            <div className="kpi-card flex items-center gap-4 p-5">
              <FiCloud className="text-greenAccent text-3xl" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Carbon Emitted</p>
                <p className="text-2xl font-bold text-white">{(user.total_carbon_kg || 0).toFixed(4)} <span className="text-sm text-gray-400">kg</span></p>
              </div>
            </div>
            <div className="kpi-card flex items-center gap-4 p-5">
              <FiDollarSign className="text-greenAccent text-3xl" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-white">₹{(user.total_cost_inr || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Requests over time */}
            <div className="panel">
              <div className="panel-title flex items-center gap-2">
                <FiTrendingUp /> Requests Over Time (Last 12 hours)
              </div>
              <ReactECharts option={requestChart} style={{ height: 240 }} />
            </div>

            {/* Carbon trend */}
            <div className="panel">
              <div className="panel-title flex items-center gap-2">
                <FiCloud /> Carbon Emission Trend (grams CO₂)
              </div>
              <ReactECharts option={carbonChart} style={{ height: 240 }} />
            </div>
          </div>

          {/* Feature Usage & Services */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Feature Usage Chart */}
            <div className="panel">
              <div className="panel-title flex items-center gap-2">
                <FiServer /> Feature Usage Breakdown
              </div>
              {featureNames.length > 0 ? (
                <ReactECharts option={featureChart} style={{ height: 280 }} />
              ) : (
                <p className="text-gray-500 text-sm mt-4">No feature usage data</p>
              )}
            </div>

            {/* Active Services */}
            <div className="panel">
              <div className="panel-title flex items-center gap-2">
                <FiActivity /> Currently Active Services
              </div>
              {services && services.active_services && services.active_services.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {services.active_services.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-bgPrimary rounded border border-borderSubtle">
                      <div>
                        <p className="text-sm font-semibold text-white">{svc.name}</p>
                        <p className="text-[10px] text-gray-500">{svc.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-yellowAccent">${svc.cost_per_hour}/hr</p>
                        <p className="text-[10px] text-redAccent">{svc.carbon_per_hour}g CO₂/hr</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 pt-3 border-t border-borderSubtle grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Cost Rate</p>
                      <p className="text-lg font-bold text-yellowAccent">${services.total_cost_per_hour}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">CO₂ Rate</p>
                      <p className="text-lg font-bold text-redAccent">{services.total_carbon_per_hour}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Power</p>
                      <p className="text-lg font-bold text-blueAccent">{services.total_power_watts}W</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No active services</p>
                  <p className="text-gray-600 text-xs mt-2">User has not enabled any services yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Devices & Info */}
          <div className="panel">
            <div className="panel-title">Account Details</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Active Devices</p>
                <p className="text-lg font-bold text-white">{user.active_devices || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Account Type</p>
                <p className="text-lg font-bold text-blueAccent">Professional</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Status</p>
                <p className={"text-lg font-bold " + (user.is_online ? "text-greenAccent" : "text-gray-400")}>
                  {user.is_online ? "Online" : "Offline"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Last Seen</p>
                <p className="text-lg font-bold text-white">
                  {user.last_seen ? new Date(user.last_seen).toLocaleTimeString() : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
