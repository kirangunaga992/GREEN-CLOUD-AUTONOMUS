import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FiRefreshCw, FiBell, FiSettings, FiMaximize, FiCpu } from "react-icons/fi";
import { useLiveStream } from "./hooks/useWebSocket";

export default function Header() {
  const [time, setTime] = useState(dayjs());
  const [isScaling, setIsScaling] = useState(false);
  const { connected } = useLiveStream();

  useEffect(() => {
    const i = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(i);
  }, []);

  const triggerScale = async () => {
    setIsScaling(true);
    try {
      await fetch("http://localhost:8000/api/scaling/wakeup", { method: "POST" });
    } catch {}
    setTimeout(() => setIsScaling(false), 2000);
  };

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-borderSubtle bg-panel">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-white">
          GREENOPS AUTONOMOUS
        </h1>
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          Live K8s Operations · WebSocket Streaming
        </p>
      </div>

      <div className="flex items-center gap-5 text-xs text-gray-400">
        <button
          onClick={triggerScale}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-white font-bold transition-all
            ${isScaling ? "bg-yellow-500 animate-pulse" : "bg-blueAccent hover:bg-blue-600"}`}
        >
          <FiCpu /> {isScaling ? "Scaling..." : "Force Scale-Up"}
        </button>

        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-greenAccent animate-pulse shadow-[0_0_8px_#22C55E]" : "bg-redAccent"}`} />
          {connected ? "LIVE" : "OFFLINE"}
        </span>

        <span>{time.format("HH:mm:ss")}</span>
        <FiRefreshCw className="cursor-pointer hover:text-white" />
        <FiBell className="cursor-pointer hover:text-white" />
        <FiSettings className="cursor-pointer hover:text-white" />
        <FiMaximize className="cursor-pointer hover:text-white" />
      </div>
    </div>
  );
}
