import { useEffect, useState } from "react";

const ICONS = {
  analytics: "📊",
  ai_compute: "��",
  file_storage: "📁",
  email: "📧",
  video: "🎥",
  database: "🗄️"
};

const COLORS = {
  blue: { border: "border-blueAccent", bg: "bg-blueAccent/10", text: "text-blueAccent", glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]" },
  purple: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]" },
  green: { border: "border-greenAccent", bg: "bg-greenAccent/10", text: "text-greenAccent", glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]" },
  yellow: { border: "border-yellowAccent", bg: "bg-yellowAccent/10", text: "text-yellowAccent", glow: "shadow-[0_0_20px_rgba(250,204,21,0.3)]" },
  red: { border: "border-redAccent", bg: "bg-redAccent/10", text: "text-redAccent", glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]" },
  cyan: { border: "border-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]" },
};

export default function ServiceUsage() {
  const [services, setServices] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("http://localhost:8000/api/services/active");
        const data = await r.json();
        if (data.success) {
          setServices(data.services || []);
          setOnlineUsers(data.total_online_users || 0);
        }
      } catch (e) { console.error(e); }
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const activeServices = services.filter(s => s.users && s.users.length > 0);
  const idleServices = services.filter(s => !s.users || s.users.length === 0);
  const totalActivePower = activeServices.reduce((sum, s) => sum + s.power_watts, 0);
  const totalActiveCost = activeServices.reduce((sum, s) => sum + s.cost_per_hour, 0);
  const totalActiveCarbon = activeServices.reduce((sum, s) => sum + s.carbon_per_hour, 0);

  return (
    <div className="panel">
      <div className="panel-title flex justify-between items-center">
        <span>Live Service Usage — Per-User Selection</span>
        <div className="flex gap-4 text-xs">
          <span className="text-greenAccent">* {activeServices.length} IN USE</span>
          <span className="text-gray-500">* {idleServices.length} IDLE</span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="mt-3 mb-4 grid grid-cols-4 gap-3">
        <div className="bg-bgPrimary p-3 rounded border border-greenAccent/30">
          <p className="text-[10px] text-greenAccent uppercase mb-1">Active Services</p>
          <p className="text-2xl font-bold text-greenAccent">{activeServices.length}</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-blueAccent/30">
          <p className="text-[10px] text-blueAccent uppercase mb-1">Online Users</p>
          <p className="text-2xl font-bold text-blueAccent">{onlineUsers}</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-yellowAccent/30">
          <p className="text-[10px] text-yellowAccent uppercase mb-1">Total Power</p>
          <p className="text-2xl font-bold text-yellowAccent">{totalActivePower}W</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-redAccent/30">
          <p className="text-[10px] text-redAccent uppercase mb-1">Carbon Rate</p>
          <p className="text-2xl font-bold text-redAccent">{totalActiveCarbon}g/hr</p>
        </div>
      </div>

      {/* Service Grid */}
      {services.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">Loading services...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => {
            const isActive = svc.users && svc.users.length > 0;
            const color = COLORS[svc.color] || COLORS.blue;

            return (
              <div
                key={svc.id}
                className={"rounded-md border p-4 transition-all duration-500 " +
                  (isActive
                    ? `${color.border} ${color.bg} ${color.glow}`
                    : "border-gray-700 bg-gray-800/20 opacity-60")}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ICONS[svc.id] || "🔧"}</span>
                    <div>
                      <p className={"text-sm font-bold " + (isActive ? "text-white" : "text-gray-400")}>
                        {svc.name}
                      </p>
                      <p className="text-[10px] text-gray-500">{svc.description}</p>
                    </div>
                  </div>
                  <div className={"w-2.5 h-2.5 rounded-full " + (isActive ? color.text.replace("text", "bg") + " animate-pulse" : "bg-gray-600")}></div>
                </div>

                {/* Status */}
                <p className={"text-xs uppercase font-bold mb-2 " + (isActive ? color.text : "text-gray-500")}>
                  * {isActive ? "IN USE" : "IDLE"}
                </p>

                {/* Users */}
                {isActive ? (
                  <div className="mb-2">
                    <p className="text-[9px] text-gray-400 uppercase mb-1">Used by {svc.users.length} user{svc.users.length > 1 ? "s" : ""}:</p>
                    <div className="flex flex-wrap gap-1">
                      {svc.users.map((u, i) => (
                        <span key={i} className={"text-[10px] text-white px-2 py-0.5 rounded font-semibold " + color.bg + " border " + color.border}>
                          {u.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 mb-2 italic">No users active</p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-gray-700">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">Cost/hr</p>
                    <p className={"text-xs font-mono font-bold " + (isActive ? "text-yellowAccent" : "text-gray-600")}>
                      ${svc.cost_per_hour}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">CO₂/hr</p>
                    <p className={"text-xs font-mono font-bold " + (isActive ? "text-redAccent" : "text-gray-600")}>
                      {svc.carbon_per_hour}g
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">Power</p>
                    <p className={"text-xs font-mono font-bold " + (isActive ? "text-blueAccent" : "text-gray-600")}>
                      {svc.power_watts}W
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-blueAccent/10 border border-blueAccent/30 rounded text-xs text-gray-300">
        <strong className="text-white">Per-User Service Usage:</strong>
        &nbsp;Users select which cloud services they want to use from their portal.
        &nbsp;<strong className="text-greenAccent">IN USE</strong> = at least one user has enabled this service.
        &nbsp;<strong className="text-gray-400">IDLE</strong> = no users active (energy saved).
        &nbsp;Total cost accumulates per hour based on which services are active.
      </div>
    </div>
  );
}
