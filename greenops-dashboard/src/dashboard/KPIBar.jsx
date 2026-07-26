import { FiCpu, FiDatabase, FiUsers, FiActivity, FiZap, FiServer, FiHardDrive, FiCloud } from "react-icons/fi";
import { useLiveStream } from "./hooks/useWebSocket";

function KPI({ icon, label, value, unit, color = "text-greenAccent" }) {
  return (
    <div className="kpi-card flex items-center gap-4 p-5 transition-transform hover:scale-[1.02]">
      <div className={`${color} text-3xl`}>{icon}</div>
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-tight">
          {value ?? 0} <span className="text-sm text-gray-400 font-normal">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function KPIBar() {
  const { data } = useLiveStream();
  const m = data?.metrics ?? {};
  const s = data?.sustainability ?? {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPI icon={<FiCpu />} label="CPU Usage" value={m.cpu_percent?.toFixed?.(1) ?? 0} unit="%" />
      <KPI icon={<FiDatabase />} label="Memory" value={m.memory_percent?.toFixed?.(1) ?? 0} unit="%" color="text-blueAccent" />
      <KPI icon={<FiUsers />} label="Active Users" value={m.active_users ?? 0} color="text-blueAccent" />
      <KPI icon={<FiServer />} label="Target Replicas" value={m.desired_replicas ?? 0} />

      <KPI icon={<FiHardDrive />} label="Live Pods" value={m.current_replicas ?? 0} />
      <KPI icon={<FiActivity />} label="Requests / Sec" value={m.current_rps?.toFixed?.(1) ?? 0} color="text-yellowAccent" />
      <KPI icon={<FiZap />} label="Power Draw" value={s.current_power_watts?.toFixed?.(1) ?? 0} unit="W" color="text-yellowAccent" />
      <KPI icon={<FiCloud />} label="Carbon Emitted" value={s.total_carbon_kg?.toFixed?.(4) ?? 0} unit="kg CO₂" />
    </div>
  );
}
