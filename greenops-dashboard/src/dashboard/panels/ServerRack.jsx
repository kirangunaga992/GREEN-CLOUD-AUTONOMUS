import { useEffect, useState } from "react";
import { FiServer, FiDatabase, FiGlobe, FiCpu, FiBox, FiUsers } from "react-icons/fi";

const iconFor = (name) => {
  const n = name.toLowerCase();
  if (n.includes("mongo")) return <FiDatabase />;
  if (n.includes("gateway")) return <FiGlobe />;
  if (n.includes("workload")) return <FiBox />;
  if (n.includes("api")) return <FiCpu />;
  if (n.includes("dashboard")) return <FiServer />;
  return <FiServer />;
};

const labelFor = (name) => {
  const n = name.toLowerCase();
  if (n.includes("mongo")) return "DATABASE";
  if (n.includes("gateway")) return "USER GATEWAY";
  if (n.includes("workload")) return "AI WORKLOAD";
  if (n.includes("api")) return "BACKEND API";
  if (n.includes("dashboard")) return "DASHBOARD UI";
  if (n.includes("control-plane")) return "K8S MASTER";
  if (n.includes("worker")) return "K8S WORKER";
  return "SERVICE";
};

const cleanName = (name) => {
  return name.replace("greenops-autonomous-", "").replace("greenops-datacenter-", "k8s-").replace(/-1$/, "");
};

const isUsedByUser = (podName) => {
  const n = podName.toLowerCase();
  return n.includes("gateway") || n.includes("api") || n.includes("mongo") || n.includes("workload");
};

export default function ServerRack() {
  const [pods, setPods] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("http://localhost:8000/api/cluster/pods");
        const data = await r.json();
        const all = [...(data.docker_containers || []), ...(data.k8s_pods || [])];
        setPods(all.filter(p => !p.name.includes("cloudflared") && !p.name.includes("buildkit")));
      } catch (e) { console.error(e); }
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("http://localhost:8000/api/users/all");
        const data = await r.json();
        setUsers((data.users || []).filter(u => u.is_online));
      } catch (e) {}
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const onlineCount = users.length;

  const podStatus = (pod) => {
    const isRunning = pod.status === "running" || pod.status === "Running";
    if (!isRunning) return "off";
    if (onlineCount > 0 && isUsedByUser(pod.name)) return "in_use";
    return "idle";
  };

  const inUseCount = pods.filter(p => podStatus(p) === "in_use").length;
  const idleCount = pods.filter(p => podStatus(p) === "idle").length;
  const totalPower = inUseCount * 90;
  const wastedPower = idleCount * 90;

  return (
    <div className="panel">
      <div className="panel-title flex justify-between items-center">
        <span>Live Kubernetes Cluster - Server Usage</span>
        <div className="flex gap-4 text-xs">
          <span className="text-greenAccent">* {inUseCount} IN USE</span>
          <span className="text-gray-500">* {idleCount} IDLE (wasted)</span>
        </div>
      </div>

      <div className={"mt-3 mb-4 p-4 rounded border " + (onlineCount > 0 ? "border-greenAccent/40 bg-greenAccent/5" : "border-gray-600 bg-gray-800/30")}>
        <div className="flex items-center gap-3">
          <FiUsers className={onlineCount > 0 ? "text-greenAccent text-xl" : "text-gray-500 text-xl"} />
          <div className="flex-1">
            <p className={"text-sm font-bold " + (onlineCount > 0 ? "text-white" : "text-gray-400")}>
              {onlineCount === 0
                ? "No users logged in - all servers sitting IDLE (wasting energy)"
                : `${onlineCount} user${onlineCount > 1 ? "s" : ""} logged in - serving them with ${inUseCount} active servers`}
            </p>
            {onlineCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {users.map((u, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-greenAccent/20 border border-greenAccent/40 text-xs text-white font-semibold">
                    * {u.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {pods.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4 py-8 text-center">Loading pods...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {pods.map((pod, i) => {
            const status = podStatus(pod);
            const isInUse = status === "in_use";
            const isIdle = status === "idle";

            let borderClass = "border-gray-700 bg-gray-800/20 opacity-50";
            let dotClass = "bg-gray-600";
            let statusLabel = "OFF";
            let statusColor = "text-gray-600";
            let iconColor = "text-gray-600";

            if (isInUse) {
              borderClass = "border-greenAccent bg-greenAccent/15 shadow-[0_0_25px_rgba(34,197,94,0.35)]";
              dotClass = "bg-greenAccent animate-pulse shadow-[0_0_10px_#22C55E]";
              statusLabel = "IN USE";
              statusColor = "text-greenAccent";
              iconColor = "text-greenAccent";
            } else if (isIdle) {
              borderClass = "border-gray-600 bg-gray-800/30 opacity-70";
              dotClass = "bg-gray-500";
              statusLabel = "IDLE";
              statusColor = "text-gray-400";
              iconColor = "text-gray-500";
            }

            return (
              <div key={i} className={"relative rounded-md border p-4 transition-all duration-500 " + borderClass}>
                <div className="absolute top-2 right-2">
                  <div className={"w-2.5 h-2.5 rounded-full " + dotClass} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={iconColor + " text-xl"}>{iconFor(pod.name)}</span>
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider truncate">
                    {labelFor(pod.name)}
                  </span>
                </div>
                <p className={"text-xs font-bold mb-1 truncate " + (isInUse ? "text-white" : "text-gray-500")} title={pod.name}>
                  {cleanName(pod.name)}
                </p>
                <p className={"text-[11px] uppercase font-bold " + statusColor}>
                  * {statusLabel}
                </p>
                {isInUse && (
                  <div className="mt-3 pt-2 border-t border-greenAccent/30">
                    <p className="text-[9px] text-gray-400 uppercase mb-1">Serving:</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {users.slice(0, 3).map((u, j) => (
                        <span key={j} className="text-[9px] text-white bg-greenAccent/30 px-1.5 py-0.5 rounded truncate max-w-full">
                          {u.name.split(" ")[0]}
                        </span>
                      ))}
                      {users.length > 3 && (<span className="text-[9px] text-gray-300">+{users.length - 3}</span>)}
                    </div>
                    <p className="text-[10px] text-yellowAccent font-mono">Consuming 90W</p>
                  </div>
                )}
                {isIdle && (
                  <div className="mt-3 pt-2 border-t border-gray-700">
                    <p className="text-[9px] text-gray-500">Not serving anyone</p>
                    <p className="text-[10px] text-redAccent/70 font-mono mt-1">Wasting 90W</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-bgPrimary p-3 rounded border border-greenAccent/30">
          <p className="text-[10px] text-greenAccent uppercase mb-1">In Use</p>
          <p className="text-2xl font-bold text-greenAccent">{inUseCount}</p>
          <p className="text-[9px] text-gray-500 mt-1">Serving users</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-gray-600">
          <p className="text-[10px] text-gray-400 uppercase mb-1">Idle</p>
          <p className="text-2xl font-bold text-gray-400">{idleCount}</p>
          <p className="text-[9px] text-redAccent mt-1">Wasted resources</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-yellowAccent/30">
          <p className="text-[10px] text-yellowAccent uppercase mb-1">Active Power</p>
          <p className="text-2xl font-bold text-yellowAccent">{totalPower}W</p>
          <p className="text-[9px] text-gray-500 mt-1">Useful energy</p>
        </div>
        <div className="bg-bgPrimary p-3 rounded border border-redAccent/30">
          <p className="text-[10px] text-redAccent uppercase mb-1">Wasted Power</p>
          <p className="text-2xl font-bold text-redAccent">{wastedPower}W</p>
          <p className="text-[9px] text-gray-500 mt-1">Idle pods energy</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blueAccent/10 border border-blueAccent/30 rounded text-xs text-gray-300">
        <strong className="text-white">Live Server Utilization:</strong>
        &nbsp;<strong className="text-greenAccent">IN USE</strong> = actively serving a logged-in user.
        &nbsp;<strong className="text-gray-400">IDLE</strong> = no user activity (wasting energy).
        &nbsp;When users login, GreenOps dynamically activates only the servers they need.
      </div>
    </div>
  );
}
