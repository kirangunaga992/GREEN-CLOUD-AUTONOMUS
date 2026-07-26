import { useEffect, useState } from "react";
const SEV={INFO:"text-blueAccent",WARN:"text-yellowAccent",ERROR:"text-redAccent",SUCCESS:"text-greenAccent"};
const COMPS=["Backend","Frontend","AutoScaler","Prometheus","MongoDB","K8s"];
const MSGS=["Scale-Up initiated (12 instances) - User Surge","Delayed Scale-Down (15 mins) - Service: Backend","High Carbon Grid detected (GCP Region-2)","New pod scheduled successfully","HPA triggered by CPU threshold","Prophet model predicted +30% traffic","Container health check passed","Renewable energy source active"];
export default function LogsPanel() {
  const [logs,setLogs]=useState([]);
  useEffect(()=>{
    const id=setInterval(()=>{
      const sev=Object.keys(SEV)[Math.floor(Math.random()*4)];
      const log={t:new Date().toISOString().slice(0,19).replace("T"," "),sev,c:COMPS[Math.floor(Math.random()*COMPS.length)],m:MSGS[Math.floor(Math.random()*MSGS.length)]};
      setLogs(l=>[log,...l].slice(0,20));
    },2000);
    return()=>clearInterval(id);
  },[]);
  return (
    <div className="panel">
      <div className="panel-title flex justify-between"><span>Carbon & Scaling Logs</span><span className="text-gray-500 text-[10px]">Auto-refresh 2s</span></div>
      <div className="text-xs font-mono h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="text-gray-500 border-b border-borderSubtle">
            <tr><th className="text-left py-1">Timestamp</th><th className="text-left">Severity</th><th className="text-left">Component</th><th className="text-left">Message</th></tr>
          </thead>
          <tbody>
            {logs.map((l,i)=>(
              <tr key={i} className="border-b border-borderSubtle/40 hover:bg-white/5">
                <td className="py-1 text-gray-400">{l.t}</td>
                <td className={SEV[l.sev]}>{l.sev}</td>
                <td className="text-gray-300">{l.c}</td>
                <td className="text-gray-300">{l.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
