import ReactECharts from "echarts-for-react";
export default function CarbonPerUser() {
  const option = {
    tooltip:{trigger:"axis"},
    legend:{data:["Actual Carbon","Target","Threshold"],textStyle:{color:"#ccc"},bottom:0},
    grid:{left:50,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:Array.from({length:12},(_,i)=>`${11+Math.floor(i/2)}:${i%2?"30":"00"}`),axisLabel:{color:"#888"}},
    yAxis:{type:"value",name:"gCO2e/hr",axisLabel:{color:"#888"}},
    series:[
      {name:"Actual Carbon",type:"line",smooth:true,color:"#FACC15",data:Array.from({length:12},()=>200+Math.random()*300)},
      {name:"Target",type:"line",smooth:true,color:"#22C55E",lineStyle:{type:"dashed"},data:Array(12).fill(150)},
      {name:"Threshold",type:"line",smooth:true,color:"#EF4444",lineStyle:{type:"dashed"},data:Array(12).fill(400)}
    ]
  };
  return (<div className="panel"><div className="panel-title">Carbon Per User Hour</div><ReactECharts option={option} style={{height:260}}/></div>);
}
