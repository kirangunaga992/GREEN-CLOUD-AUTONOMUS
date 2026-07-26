import { useEffect, useState } from "react";
import { FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi";

export default function ScalingFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let ws = null;
    let alive = true;
    
    const connect = () => {
      if (!alive) return;
      try {
        ws = new WebSocket("ws://localhost:8000/ws/live");
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.recent_events) {
              setEvents(msg.recent_events.slice(0, 8));
            }
          } catch {}
        };
        ws.onclose = () => setTimeout(connect, 3000);
      } catch {
        setTimeout(connect, 3000);
      }
    };
    connect();
    return () => { alive = false; if (ws) ws.close(); };
  }, []);

  const getIcon = (action) => {
    if (action === "scale_up") return <FiTrendingUp className="text-greenAccent" />;
    if (action === "scale_down") return <FiTrendingDown className="text-yellowAccent" />;
    return <FiClock className="text-gray-400" />;
  };

  const getColor = (action) => {
    if (action === "scale_up") return "border-l-greenAccent bg-greenAccent/5";
    if (action === "scale_down") return "border-l-yellowAccent bg-yellowAccent/5";
    return "border-l-gray-500 bg-gray-500/5";
  };

  const timeAgo = (ts) => {
    if (!ts) return "-";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  return (
    <div className="panel flex flex-col" style={{ height: "320px" }}>
      <div className="panel-title flex justify-between items-center">
        <span>🔥 Live Scaling Feed</span>
        <span className="text-blueAccent text-xs bg-blueAccent/10 px-2 py-0.5 rounded animate-pulse">
          REAL-TIME
        </span>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scroll">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 text-xs mt-8">
            <p>Waiting for scaling events...</p>
            <p className="mt-2 text-[10px]">Login users or simulate traffic</p>
          </div>
        ) : (
          events.map((ev, i) => (
            <div
              key={i}
              className={`p-3 border-l-4 rounded-md ${getColor(ev.action)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getIcon(ev.action)}</span>
                  <span className="text-sm font-bold text-white uppercase">
                    {ev.action?.replace("_", " ") || "unknown"}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">{timeAgo(ev.timestamp)}</span>
              </div>
              <p className="text-xs text-gray-300 mb-1">{ev.reason}</p>
              <div className="flex gap-3 text-[10px] text-gray-400 font-mono">
                <span>Pods: {ev.current_replicas} → <span className="text-white font-bold">{ev.desired_replicas}</span></span>
                <span>CPU: {ev.cpu_percent?.toFixed?.(1)}%</span>
                <span>Users: {ev.active_users}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
