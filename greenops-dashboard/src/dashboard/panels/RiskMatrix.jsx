import ReactECharts from "echarts-for-react";
export default function RiskMatrix() {
  const impact=["Low","Medium","High","Critical"];
  const likelihood=["Negligible","Low","Medium","High","Critical"];
  const data=[];
  for(let i=0;i<likelihood.length;i++) for(let j=0;j<impact.length;j++) data.push([j,i,Math.floor(Math.random()*5)+1]);
  const option = {
    tooltip:{position:"top"},grid:{left:80,right:20,top:20,bottom:40},
    xAxis:{type:"category",data:impact,name:"Impact",axisLabel:{color:"#888"},nameTextStyle:{color:"#888"}},
    yAxis:{type:"category",data:likelihood,name:"Likelihood",axisLabel:{color:"#888"},nameTextStyle:{color:"#888"}},
    visualMap:{min:1,max:5,calculable:true,orient:"horizontal",left:"center",bottom:0,textStyle:{color:"#888"},inRange:{color:["#22C55E","#FACC15","#F97316","#EF4444"]}},
    series:[{name:"Risk",type:"heatmap",data,label:{show:true,color:"#fff"}}]
  };
  return (<div className="panel"><div className="panel-title">Risk Matrix (Heatmap)</div><ReactECharts option={option} style={{height:280}}/></div>);
}
