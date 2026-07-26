import { useState } from "react";
const TASKS=["Implement Aggressive Scale-Down Policies","Optimize Workload Scheduling for Low-Carbon Grid","Expand Spot Instance Utilization","Serverless Efficiency Benchmarking","Develop Internal Carbon Offset Strategy","Predictive Scaling with Prophet ML","Dynamic Workload Migration","Carbon Budget Tracking System","Container Right-Sizing"];
export default function RoadmapPanel() {
  const [done,setDone]=useState({});
  return (
    <div className="panel">
      <div className="panel-title">Phase 2 Decarbonization Roadmap</div>
      <ul className="text-sm space-y-2 text-gray-300">
        {TASKS.map((t,i)=>(
          <li key={i} className="flex items-center gap-2">
            <input type="checkbox" checked={!!done[i]} onChange={()=>setDone({...done,[i]:!done[i]})} className="accent-greenAccent"/>
            <span className={done[i]?"line-through text-gray-500":""}>{i+1}. {t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
