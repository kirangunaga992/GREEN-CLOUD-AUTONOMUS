import ReactECharts from "echarts-for-react";
export default function RenewableDonut() {
  const option = {
    tooltip:{trigger:"item"},
    legend:{orient:"vertical",right:10,top:"center",textStyle:{color:"#ccc"}},
    series:[{
      name:"Energy",type:"pie",radius:["55%","80%"],
      itemStyle:{borderColor:"#0B0F14",borderWidth:2},label:{color:"#fff"},
      data:[
        {value:65,name:"Solar",itemStyle:{color:"#FACC15"}},
        {value:25,name:"Wind",itemStyle:{color:"#3B82F6"}},
        {value:10,name:"Hydro",itemStyle:{color:"#22C55E"}},
        {value:15,name:"Grid",itemStyle:{color:"#EF4444"}},
        {value:8,name:"Carbon Offset",itemStyle:{color:"#8B5CF6"}}
      ]
    }]
  };
  return (<div className="panel"><div className="panel-title">Renewable Energy Adoption</div><ReactECharts option={option} style={{height:280}}/></div>);
}
