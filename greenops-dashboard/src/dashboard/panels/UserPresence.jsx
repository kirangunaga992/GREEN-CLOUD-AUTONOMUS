import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";

export default function UserPresence() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/academic/academic-stats");
        const data = await res.json();
        if (data.success) setChartData(data.historical_data);
      } catch (e) {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 10000);
    return () => clearInterval(id);
  }, []);

  const option = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    legend: { data: ["Active Users", "CPU Load", "Carbon (g)"], textStyle: { color: "#ccc" }, bottom: 0 },
    grid: { left: 40, right: 40, top: 20, bottom: 40 },
    xAxis: { type: "category", data: chartData.map(d => d.time), axisLabel:{color:"#888", fontSize: 9} },
    yAxis: [
      { type:"value", axisLabel:{color:"#888"} },
      { type:"value", axisLabel:{color:"#888"} }
    ],
    series: [
      { name:"Active Users", type:"bar", color:"#3B82F6", data: chartData.map(d => d.users) },
      { name:"CPU Load", type:"line", smooth:true, color:"#FACC15", data: chartData.map(d => d.cpu) },
      { name:"Carbon (g)", type:"line", yAxisIndex:1, smooth:true, color:"#22C55E", data: chartData.map(d => d.carbon * 1000) }
    ]
  };

  return (
    <div className="panel">
      <div className="panel-title flex justify-between">
        <span>Historical System Load (Real Data)</span>
        <span className="text-[9px] text-blueAccent bg-blueAccent/10 px-1 rounded">MONGODB</span>
      </div>
      <ReactECharts option={option} style={{height:260}} />
    </div>
  );
}
