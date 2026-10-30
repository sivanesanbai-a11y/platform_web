"use client";
import { Area,AreaChart,Bar,BarChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis } from "recharts";
import { money } from "@/lib/data";

const COLORS=["#1677FF","#10B981","#F59E0B","#22C55E","#94A3B8","#8B5CF6","#06B6D4","#EF4444"];
const TOOLTIP_STYLE={border:"1px solid #e2e8f0",borderRadius:12,background:"rgba(255,255,255,.99)",boxShadow:"0 14px 34px rgba(15,23,42,.12)",fontSize:14,padding:"11px 13px"};

function FormsTooltip({active,payload,label}:any){
  if(!active||!payload?.length)return null;
  const row=payload[0]?.payload||{};
  const count = Number(row.servicing || row.total || 0);
  return <div className="forms-chart-tooltip"><b>{label}</b><span><i className="service-dot"/>Service Jobs <strong>{count}</strong></span><div>Total <strong>{count}</strong></div></div>;
}

export function FormsOverviewChart({data}:{data:any[]}){
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-8,right:8,top:18,bottom:4}} barGap={5} barCategoryGap="28%"><CartesianGrid vertical={false} stroke="#edf1f5"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#64748b",fontWeight:650}} tickMargin={11} minTickGap={18}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#94a3b8",fontWeight:600}} tickMargin={8}/><Tooltip content={<FormsTooltip/>} cursor={{fill:"#f8fafc"}}/><Bar dataKey="servicing" name="Service Jobs" fill="#1677FF" radius={[7,7,2,2]} maxBarSize={38}/></BarChart></ResponsiveContainer>;
}

export function CombinedStatusChart({data}:{data:Array<{name:string,value:number,color?:string}>}){
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={66} outerRadius={90} paddingAngle={2} stroke="#fff" strokeWidth={2}>{data.map((x,i)=><Cell key={`${x.name}-${i}`} fill={x.color||COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value:any,name:any)=>[Number(value||0),String(name).replaceAll("_"," ")]}/></PieChart></ResponsiveContainer>;
}

export function PurchasingTrendChart({data}:{data:any[]}){return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{left:-2,right:18,top:18,bottom:4}}><defs><linearGradient id="pArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1677FF" stopOpacity=".28"/><stop offset=".72" stopColor="#1677FF" stopOpacity=".07"/><stop offset="1" stopColor="#1677FF" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f5"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize:13,fill:"#64748b",fontWeight:650}} tickMargin={11}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#94a3b8",fontWeight:600}} tickMargin={9} tickFormatter={(v)=>`${Math.round(Number(v)/1000)}k`}/><Tooltip contentStyle={TOOLTIP_STYLE} cursor={{stroke:"#dbe4ef",strokeWidth:1}} formatter={(v:any,n:any)=>[money(v),n==="value"?"Order value":"Received"]}/><Area type="monotone" dataKey="value" stroke="#1677FF" strokeWidth={3} fill="url(#pArea)" dot={false} activeDot={{r:5,strokeWidth:2,fill:"#fff",stroke:"#1677FF"}}/><Area type="monotone" dataKey="received" stroke="#22C55E" strokeWidth={2.5} fillOpacity={0} dot={false} activeDot={{r:4,strokeWidth:2,fill:"#fff",stroke:"#22C55E"}}/></AreaChart></ResponsiveContainer>}

export function ServiceTrendChart({data}:{data:any[]}){return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-2,right:18,top:18,bottom:4}}><CartesianGrid vertical={false} stroke="#edf1f5"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize:13,fill:"#64748b",fontWeight:650}} tickMargin={11}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#94a3b8",fontWeight:600}} tickMargin={9} tickFormatter={(v)=>`${Math.round(Number(v)/1000)}k`}/><Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill:"#f8fafc"}} formatter={(v:any)=>money(v)}/><Bar dataKey="estimate" fill="#10B981" radius={[9,9,3,3]} maxBarSize={44} background={{fill:"#f1f5f9"}}/></BarChart></ResponsiveContainer>}

export function PurchasingStatusChart({data}:{data:Array<{name:string,value:number}>}){return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE}/></PieChart></ResponsiveContainer>}

export function ServiceBranchChart({data}:{data:any[]}){return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{left:52,right:18,top:14,bottom:4}}><CartesianGrid horizontal={false} stroke="#edf1f5"/><XAxis type="number" hide/><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={126} tick={{fontSize:12,fill:"#64748b",fontWeight:650}}/><Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill:"#f8fafc"}}/><Bar dataKey="jobs" fill="#10B981" radius={[0,8,8,0]} maxBarSize={30} background={{fill:"#f1f5f9"}}/></BarChart></ResponsiveContainer>}

/**
 * Modern Donut Distribution Chart matching the uploaded dashboard screenshot.
 * Outer ring with 3 color segments (deep bronze, golden amber, soft cream) and centered total.
 */
export function ModernDonutChart({
  data,
  total = "188,245",
}: {
  data: Array<{ name: string; value: number; color: string }>;
  total?: string | number;
}) {
  return (
    <div className="relative w-full h-[220px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={66}
            outerRadius={94}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`donut-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
              fontWeight: 500,
            }}
            formatter={(value: any, name: any) => [
              `${Number(value).toLocaleString()} units`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Total
        </span>
        <strong className="text-xl font-bold text-slate-800 tracking-tight">
          {total}
        </strong>
      </div>
    </div>
  );
}

/**
 * Multi-tier Stacked Bar Chart matching the "Area installed" screenshot chart.
 * 3 layers per month bar: bronze bottom, amber middle, vibrant cyan top.
 */
export function ModernStackedAreaBarChart({
  data,
}: {
  data: Array<{
    month: string;
    asia: number;
    europe: number;
    americas: number;
  }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        barSize={14}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f1f5f9"
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
          ticks={[20, 40, 60, 80]}
          domain={[0, 85]}
        />
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 12px 28px -4px rgba(0,0,0,0.12)",
            fontSize: "12px",
          }}
          formatter={(value: any, name: any) => [
            `${value}k units`,
            name === "asia"
              ? "Tamil Nadu (Coimbatore)"
              : name === "europe"
              ? "South Zone (KA/KL/AP)"
              : "All-India Dispatches",
          ]}
        />
        <Bar
          dataKey="asia"
          stackId="tier"
          fill="#8c4a16"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="europe"
          stackId="tier"
          fill="#d97706"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="americas"
          stackId="tier"
          fill="#00bcd4"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Mini Bar Sparkline for KPI Metric Cards.
 */
export function MiniSparkline({
  bars,
  color = "#f59e0b",
}: {
  bars: number[];
  color?: string;
}) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex items-end gap-1 h-8">
      {bars.map((val, idx) => {
        const heightPct = Math.max(15, Math.round((val / max) * 100));
        return (
          <div
            key={idx}
            className="w-1.5 rounded-xs transition-all duration-300 hover:opacity-80"
            style={{
              height: `${heightPct}%`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

export { COLORS };
