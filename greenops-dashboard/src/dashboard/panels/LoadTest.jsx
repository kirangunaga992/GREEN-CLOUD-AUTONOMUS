import { useState, useRef } from "react";
import { FiPlay, FiSquare, FiZap } from "react-icons/fi";

export default function LoadTest() {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    setRunning(true);
    setCount(0);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        fetch("http://localhost:8000/", { method: "GET" }).catch(() => {});
      }
      setCount((c) => c + 5);
    }, 100);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="panel">
      <div className="panel-title flex items-center gap-2">
        <FiZap className="text-yellowAccent" />
        <span>Live Load Simulator — Demo Traffic Generator</span>
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        {!running ? (
          <button onClick={start}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-greenAccent text-black font-bold text-sm hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <FiPlay /> Start Load Test (50 req/s)
          </button>
        ) : (
          <button onClick={stop}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-redAccent text-white font-bold text-sm hover:bg-red-500 transition-all animate-pulse">
            <FiSquare /> Stop Test
          </button>
        )}

        {running && (
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Requests Sent</p>
              <p className="text-xl font-bold text-yellowAccent font-mono">{count}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Elapsed</p>
              <p className="text-xl font-bold text-blueAccent font-mono">{elapsed}s</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Rate</p>
              <p className="text-xl font-bold text-greenAccent font-mono">{elapsed > 0 ? Math.round(count / elapsed) : 0}/s</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-yellowAccent/10 border border-yellowAccent/30 rounded text-xs text-gray-300">
        <strong className="text-yellowAccent">Demo Instructions:</strong> Click "Start Load Test" to simulate 50 requests/sec.
        Watch pods scale UP. Stop the test and pods will scale DOWN as demand drops.
      </div>
    </div>
  );
}
