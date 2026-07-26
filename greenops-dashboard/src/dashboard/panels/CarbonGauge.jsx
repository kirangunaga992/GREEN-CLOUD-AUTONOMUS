import ReactECharts from "echarts-for-react";
export default function CarbonGauge() {
  const option = {
    series:[{
      type:"gauge",startAngle:200,endAngle:-20,
      progress:{show:true,width:18},
      axisLine:{lineStyle:{width:18,color:[[0.3,"#EF4444"],[0.7,"#FACC15"],[1,"#22C55E"]]}},
      pointer:{width:5,length:"70%"},axisTick:{show:false},
      splitLine:{length:8,lineStyle:{color:"#333"}},axisLabel:{color:"#888",fontSize:10},
      detail:{valueAnimation:true,formatter:"{value}%",color:"#fff",fontSize:26,offsetCenter:[0,"70%"]},
      data:[{value:68,name:"Carbon Reduced"}],
      title:{color:"#aaa",fontSize:12,offsetCenter:[0,"95%"]}
    }]
  };
  return (<div className="panel"><div className="panel-title">Total Carbon Reduction</div><ReactECharts option={option} style={{height:220}}/><p className="text-center text-lg text-white font-semibold">1.2 Tons Reduced</p></div>);
}
