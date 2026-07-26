import ReactECharts from "echarts-for-react";
export default function UserPresence() {
  const option = {
    tooltip:{trigger:"axis"},
    legend:{data:["Active Users","Offline Users","Carbon (kgCO2e)"],textStyle:{color:"#ccc"},bottom:0},
    grid:{left:40,right:40,top:20,bottom:40},
    xAxis:{type:"category",data:Array.from({length:12},(_,i)=>`${10+i}:00`),axisLabel:{color:"#888"}},
    yAxis:[{type:"value",axisLabel:{color:"#888"}},{type:"value",axisLabel:{color:"#888"}}],
    series:[
      {name:"Active Users",type:"line",stack:"u",areaStyle:{},smooth:true,color:"#22C55E",data:Array.from({length:12},()=>800+Math.random()*400)},
      {name:"Offline Users",type:"line",stack:"u",areaStyle:{},smooth:true,color:"#FACC15",data:Array.from({length:12},()=>200+Math.random()*200)},
      {name:"Carbon (kgCO2e)",type:"line",yAxisIndex:1,smooth:true,color:"#EF4444",data:Array.from({length:12},()=>50+Math.random()*100)}
    ]
  };
  return (<div className="panel"><div className="panel-title">User Presence (Online/Offline)</div><ReactECharts option={option} style={{height:260}}/></div>);
}
