import ReactECharts from "echarts-for-react";
export default function ScalingHeatmap() {
  const hours=Array.from({length:24},(_,i)=>`${i}h`);
  const mins=["00","10","20","30","40","50"];
  const data=[];
  for(let i=0;i<24;i++) for(let j=0;j<6;j++) data.push([j,i,Math.floor(Math.random()*100)]);
  const option = {
    tooltip:{position:"top"},grid:{left:50,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:mins,axisLabel:{color:"#888"}},
    yAxis:{type:"category",data:hours,axisLabel:{color:"#888"}},
    visualMap:{min:0,max:100,calculable:true,orient:"horizontal",left:"center",bottom:0,textStyle:{color:"#888"},inRange:{color:["#0B3A66","#3B82F6","#FACC15","#F97316","#EF4444"]}},
    series:[{name:"Instances",type:"heatmap",data,label:{show:false}}]
  };
  return (<div className="panel"><div className="panel-title">Scaling Heatmap (Instances/Minute)</div><ReactECharts option={option} style={{height:280}}/></div>);
}
