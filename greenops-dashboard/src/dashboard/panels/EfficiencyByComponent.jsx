import ReactECharts from "echarts-for-react";
export default function EfficiencyByComponent() {
  const cats=["Frontend","Backend","Database","Cloud Native","IoT"];
  const option = {
    tooltip:{trigger:"axis"},
    legend:{data:["Completed","In Progress","Pending","Failed"],textStyle:{color:"#ccc"},bottom:0},
    grid:{left:40,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:cats,axisLabel:{color:"#888"}},
    yAxis:{type:"value",max:100,axisLabel:{color:"#888",formatter:"{value}%"}},
    series:[
      {name:"Completed",type:"bar",stack:"x",color:"#22C55E",data:[50,60,45,70,40]},
      {name:"In Progress",type:"bar",stack:"x",color:"#FACC15",data:[30,20,25,15,25]},
      {name:"Pending",type:"bar",stack:"x",color:"#3B82F6",data:[10,10,20,10,20]},
      {name:"Failed",type:"bar",stack:"x",color:"#EF4444",data:[10,10,10,5,15]}
    ]
  };
  return (<div className="panel"><div className="panel-title">Auto-Scaling Efficiency by Component</div><ReactECharts option={option} style={{height:260}}/></div>);
}
