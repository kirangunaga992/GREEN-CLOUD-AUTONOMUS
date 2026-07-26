import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiActivity } from "react-icons/fi";

export default function RequestStats() {
  const [stats, setStats] = useState(null);
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r1 = await fetch("http://localhost:8000/api/services/stats");
        const data1 = await r1.json();
        if (data1.success) setStats(data1);

        const r2 = await fetch("http://localhost:8000/api/services/failures/recent");
        const data2 = await r2.json();
        if (data2.success) setFailures(data2.failures || []);
      } catch (e) { console.error(e); }
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return <div className="panel"><p className="text-gray-500 text-sm">Loading stats...</p></div>;

  return (
    <div className="panel">
      <div className="panel-title flex justify-between items-center">
        <span>Request Success/Failure Analytics</span>
        <div className="flex gap-4 text-xs">
          <span className="text-greenAccent">* {stats.total_requests - stats.total_failed} Success</span>
          <span className="text-redAccent">* {stats.total_failed} Failed</span>
          <span className="text-yellowAccent">* {stats.overall_success_rate}% Success Rate</span>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="mt-3 mb-4 grid grid-cols-4 gap-3">
        <div className="bg-bgPrimary p-3 rounded border border-blueAccent/30">
          <p className="text-[10px] text-blueAccent uppercase mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-blueAccent">{stats.total_requests}</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-greenAccent/30">
          <p className="text-[10px] text-greenAccent uppercase mb-1">Successful</p>
          <p className="text-2xl font-bold text-greenAccent">{stats.total_requests - stats.total_failed}</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-redAccent/30">
          <p className="text-[10px] text-redAccent uppercase mb-1">Failed</p>
          <p className="text-2xl font-bold text-redAccent">{stats.total_failed}</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-yellowAccent/30">
          <p className="text-[10px] text-yellowAccent uppercase mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-yellowAccent">{stats.overall_success_rate}%</p>
        </div>
      </div>

      {/* Per-Service Stats */}
      <h3 className="text-xs text-gray-400 uppercase mb-2 tracking-widest mt-4">Per-Service Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.services.map((svc) => {
          const load = svc.capacity > 0 ? (svc.concurrent_users / svc.capacity) * 100 : 0;
          const loadColor = load > 100 ? "bg-redAccent" : load > 75 ? "bg-yellowAccent" : "bg-greenAccent";

          return (
            <div
              key={svc.id}
              className={"rounded-md border p-3 " +
                (svc.overloaded
                  ? "border-redAccent bg-redAccent/10"
                  : svc.total > 0
                  ? "border-borderSubtle bg-panel"
                  : "border-gray-700 bg-gray-800/20 opacity-60")}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-white">{svc.name}</p>
                {svc.overloaded && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-redAccent text-white font-bold animate-pulse">
                    OVERLOAD
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Success</p>
                  <p className="text-greenAccent font-mono font-bold">{svc.success}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Failed</p>
                  <p className="text-redAccent font-mono font-bold">{svc.failed}</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-400">Load: {svc.concurrent_users}/{svc.capacity}</span>
                  <span className={load > 100 ? "text-redAccent font-bold" : "text-gray-400"}>
                    {Math.round(load)}%
                  </span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-1.5">
                  <div
                    className={loadColor + " h-1.5 rounded-full transition-all"}
                    style={{ width: Math.min(100, load) + "%" }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-gray-500">
                Success rate: <span className={svc.success_rate < 80 ? "text-redAccent font-bold" : "text-greenAccent"}>{svc.success_rate}%</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Failures Log */}
      {failures.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs text-gray-400 uppercase mb-2 tracking-widest flex items-center gap-2">
            <FiAlertTriangle className="text-redAccent" /> Recent Failed Requests
          </h3>
          <div className="bg-bgPrimary rounded border border-borderSubtle max-h-64 overflow-y-auto custom-scroll">
            <table className="w-full text-xs">
              <thead className="bg-panel sticky top-0">
                <tr className="text-left">
                  <th className="p-2 text-[10px] text-gray-400 uppercase">Time</th>
                  <th className="p-2 text-[10px] text-gray-400 uppercase">User</th>
                  <th className="p-2 text-[10px] text-gray-400 uppercase">Service</th>
                  <th className="p-2 text-[10px] text-gray-400 uppercase">Reason</th>
                  <th className="p-2 text-[10px] text-gray-400 uppercase text-right">Load</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((f, i) => {
                  const time = f.timestamp ? new Date(f.timestamp).toLocaleTimeString() : "-";
                  return (
                    <tr key={i} className="border-t border-borderSubtle hover:bg-panel">
                      <td className="p-2 text-gray-400 font-mono text-[10px]">{time}</td>
                      <td className="p-2 text-white">{f.user_name}</td>
                      <td className="p-2 text-blueAccent">{f.service_name}</td>
                      <td className="p-2 text-redAccent">{f.reason}</td>
                      <td className="p-2 text-right text-yellowAccent font-mono text-[10px]">
                        {f.concurrent_users}/{f.capacity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blueAccent/10 border border-blueAccent/30 rounded text-xs text-gray-300">
        <strong className="text-white">Live Request Tracking:</strong>
        &nbsp;When users send requests to services, some succeed (200 OK) and some fail (503 Service Unavailable).
        &nbsp;Failures happen when concurrent users exceed service capacity — a real cloud problem.
        &nbsp;Auto-scaling would normally add more capacity, but this shows the raw system stress.
      </div>
    </div>
  );
}
