import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";

export default function CarbonGauge() {
  const [stats, setStats] = useState({ percent: 0, saved: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/academic/academic-stats");
        const data = await res.json();
        if (data.success) {
          setStats({
            percent: data.savings_percent,
            saved: (data.baseline.carbon_kg - data.greenops.carbon_kg).toFixed(2)
          });
        }
      } catch (e) {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 10000);
    return () => clearInterval(id);
  }, []);

  const option = {
    series:[{
      type:"gauge", startAngle:200, endAngle:-20,
      progress: {show:true, width:18},
      axisLine: {lineStyle:{width:18, color:[[0.3,"#EF4444"],[0.7,"#FACC15"],[1,"#22C55E"]]}},
      pointer: {width:5, length:"70%"}, axisTick:{show:false},
      splitLine: {length:8, lineStyle:{color:"#333"}}, axisLabel:{color:"#888", fontSize:10},
      detail: {valueAnimation:true, formatter:"{value}%", color:"#fff", fontSize:26, offsetCenter:[0,"70%"]},
      data: [{value: stats.percent, name:"Measured Carbon Reduced"}],
      title: {color:"#aaa", fontSize:10, offsetCenter:[0,"95%"]}
    }]
  };

  return (
    <div className="panel flex flex-col justify-center items-center" style={{ height: "340px" }}>
      <div className="panel-title flex justify-between w-full absolute top-4 px-4">
        <span>Measured Carbon Reduction</span>
        <span className="text-[9px] text-greenAccent bg-greenAccent/10 px-1 rounded">DYNAMIC</span>
      </div>
      <ReactECharts option={option} style={{ height: "220px", width: "100%", marginTop: "20px" }} />
      <p className="text-center text-lg text-white font-semibold">{stats.saved} kg CO₂ Prevented</p>
      <p className="text-center text-[9px] text-gray-500 mt-1">Calculated vs Always-On Baseline</p>
    </div>
  );
}
