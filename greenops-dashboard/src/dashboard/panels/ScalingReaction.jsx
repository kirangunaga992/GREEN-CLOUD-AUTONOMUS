import ReactECharts from "echarts-for-react";
export default function ScalingReaction() {
  const option = {
    tooltip:{trigger:"axis"},
    legend:{data:["Scale-Up","Scale-Down"],textStyle:{color:"#ccc"},bottom:0},
    grid:{left:40,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:["Frontend","Backend","Database","Cloud Native","IoT"],axisLabel:{color:"#888"}},
    yAxis:{type:"value",name:"Seconds",axisLabel:{color:"#888"}},
    series:[
      {name:"Scale-Up",type:"bar",color:"#22C55E",data:[45,30,55,25,60]},
      {name:"Scale-Down",type:"bar",color:"#FACC15",data:[75,60,90,50,120]}
    ]
  };
  return (<div className="panel"><div className="panel-title">Scaling Reaction Time</div><ReactECharts option={option} style={{height:260}}/></div>);
}
