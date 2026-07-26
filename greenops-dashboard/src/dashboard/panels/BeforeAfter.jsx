import { useEffect, useState } from "react";

export default function BeforeAfter() {
  const [data, setData] = useState({ current: 0, energy: 0, carbon: 0, cost: 0 });
  const MAX = 5;

  useEffect(() => {
    let alive = true;
    const connect = () => {
      if (!alive) return;
      try {
        const ws = new WebSocket("ws://localhost:8000/ws/live");
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            setData({
              current: msg.metrics?.current_replicas || 0,
              energy: msg.sustainability?.total_energy_kwh || 0,
              carbon: msg.sustainability?.total_carbon_kg || 0,
              cost: msg.sustainability?.total_cost_inr || 0,
            });
          } catch {}
        };
        ws.onclose = () => setTimeout(connect, 3000);
      } catch { setTimeout(connect, 3000); }
    };
    connect();
    return () => { alive = false; };
  }, []);

  const tradEnergy = (MAX * 90 * 24 / 1000).toFixed(2);
  const tradCarbon = (tradEnergy * 0.708).toFixed(3);
  const tradCost = (tradEnergy * 8).toFixed(2);
  const yourEnergy = data.energy.toFixed(3);
  const yourCarbon = data.carbon.toFixed(3);
  const yourCost = data.cost.toFixed(2);
  const savedEnergy = (tradEnergy - yourEnergy).toFixed(2);
  const savedCarbon = (tradCarbon - yourCarbon).toFixed(3);
  const savedCost = (tradCost - yourCost).toFixed(2);
  const savedPct = tradEnergy > 0 ? ((savedEnergy / tradEnergy) * 100).toFixed(0) : 0;

  return (
    <div className="panel">
      <div className="panel-title">Traditional Cloud vs GreenOps AI</div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 rounded border border-redAccent/30 bg-redAccent/5">
          <p className="text-xs text-redAccent uppercase font-bold mb-2">Traditional Cloud</p>
          <p className="text-[10px] text-gray-400 mb-3">Always {MAX} servers ON, 24/7</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Energy / day</span><span className="text-white font-mono">{tradEnergy} kWh</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Carbon / day</span><span className="text-white font-mono">{tradCarbon} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Cost / day</span><span className="text-white font-mono">₹{tradCost}</span></div>
          </div>
        </div>

        <div className="p-4 rounded border border-greenAccent/30 bg-greenAccent/5">
          <p className="text-xs text-greenAccent uppercase font-bold mb-2">GreenOps AI</p>
          <p className="text-[10px] text-gray-400 mb-3">{data.current} server(s) on demand</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Energy used</span><span className="text-white font-mono">{yourEnergy} kWh</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Carbon emitted</span><span className="text-white font-mono">{yourCarbon} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Cost incurred</span><span className="text-white font-mono">₹{yourCost}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded bg-gradient-to-r from-greenAccent/20 to-blueAccent/20 border border-greenAccent/40">
        <p className="text-xs text-gray-300 uppercase mb-2 font-bold tracking-widest">Total Savings</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-2xl font-bold text-greenAccent">{savedPct}%</p><p className="text-[10px] text-gray-400">Less Energy</p></div>
          <div><p className="text-2xl font-bold text-yellowAccent">{savedCarbon} kg</p><p className="text-[10px] text-gray-400">CO₂ Saved</p></div>
          <div><p className="text-2xl font-bold text-blueAccent">₹{savedCost}</p><p className="text-[10px] text-gray-400">Money Saved</p></div>
        </div>
      </div>
    </div>
  );
}
