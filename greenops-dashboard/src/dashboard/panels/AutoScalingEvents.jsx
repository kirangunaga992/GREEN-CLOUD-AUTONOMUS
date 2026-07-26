import ReactECharts from "echarts-for-react";
export default function AutoScalingEvents() {
  const option = {
    tooltip:{trigger:"axis"},
    legend:{data:["Scale-Up","Scale-Down","User Demand"],textStyle:{color:"#ccc"},bottom:0},
    grid:{left:40,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:Array.from({length:14},(_,i)=>`${11+Math.floor(i/2)}:${i%2?"30":"00"}`),axisLabel:{color:"#888"}},
    yAxis:{type:"value",axisLabel:{color:"#888"}},
    series:[
      {name:"Scale-Up",type:"line",smooth:true,color:"#22C55E",data:Array.from({length:14},()=>Math.random()*100+50)},
      {name:"Scale-Down",type:"line",smooth:true,color:"#FACC15",data:Array.from({length:14},()=>Math.random()*80+20)},
      {name:"User Demand",type:"line",smooth:true,color:"#3B82F6",lineStyle:{type:"dashed"},data:Array.from({length:14},()=>Math.random()*150+100)}
    ]
  };
  return (<div className="panel"><div className="panel-title">Auto Scaling Events (Instance Count)</div><ReactECharts option={option} style={{height:260}}/></div>);
}
