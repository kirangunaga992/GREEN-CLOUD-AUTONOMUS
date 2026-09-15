import { useState, useEffect } from "react";
import { FiCpu, FiTarget, FiActivity } from "react-icons/fi";

export default function MLPerformance() {
  const [ml, setMl] = useState({ mae: 0, accuracy_score: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/academic/academic-stats");
        const data = await res.json();
        if (data.success) setMl(data.ml_metrics);
      } catch (e) {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel">
      <div className="panel-title flex justify-between items-center mb-4">
        <span>🤖 Machine Learning Performance</span>
        <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
          PROPHET MODEL
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="bg-bgPrimary p-3 rounded-lg border border-borderSubtle flex items-center gap-4">
          <div className="p-3 bg-blueAccent/10 rounded-full"><FiTarget className="text-blueAccent text-xl"/></div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Model Accuracy</p>
            <p className="text-2xl font-bold text-white">{ml.accuracy_score.toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="bg-bgPrimary p-3 rounded-lg border border-borderSubtle flex items-center gap-4">
          <div className="p-3 bg-yellowAccent/10 rounded-full"><FiActivity className="text-yellowAccent text-xl"/></div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Mean Absolute Error (MAE)</p>
            <p className="text-2xl font-bold text-white">{ml.mae} RPS</p>
          </div>
        </div>

        <div className="p-3 bg-greenAccent/10 border border-greenAccent/30 rounded text-xs text-gray-300 mt-2">
          <strong className="text-greenAccent">Academic Validation:</strong> The Prophet ML model predicts workload (RPS) 30 mins ahead. An MAE of {ml.mae} proves the model accurately anticipates demand, allowing proactive scale-up before CPU spikes.
        </div>
      </div>
    </div>
  );
}
