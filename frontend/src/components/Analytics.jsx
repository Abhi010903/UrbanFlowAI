import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import "./Analytics.css";
import { analyticsAPI } from "../services/api";

const TT = { contentStyle:{ background:"rgba(5,12,30,0.97)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:"10px", color:"#f0f6ff", fontSize:"13px" } };

export default function Analytics() {
  const [stats,       setStats]       = useState(null);
  const [junctions,   setJunctions]   = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [timeframe,   setTimeframe]   = useState("today");
  const [loading,     setLoading]     = useState(true);

  const fetchAll = async () => {
    try {
      const [s, j, p] = await Promise.all([
        analyticsAPI.getStatistics(),
        analyticsAPI.getJunctions(),
        analyticsAPI.getPredictions(),
      ]);
      if (s.success) setStats(s.data);
      if (j.success) setJunctions(j.junctions);
      if (p.success) setPredictions(p.prediction);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 6000); return () => clearInterval(iv); }, []);

  // Build hourly trend from junction data
  const trendData = junctions.length > 0
    ? junctions.map(j => ({ name: j.name?.split(" ")[0], density: j.density, speed: Math.max(10, 60 - j.density * 0.5) }))
    : [{ name:"6AM",density:35,speed:48 },{ name:"9AM",density:72,speed:32 },{ name:"12PM",density:58,speed:38 },{ name:"3PM",density:65,speed:35 },{ name:"6PM",density:85,speed:22 },{ name:"9PM",density:45,speed:42 }];

  const zoneData = junctions.map(j => ({ zone: j.name?.split(" ")[0] || j.id, congestion: j.density, vehicles: j.vehicle_count }));

  const vbData = stats?.vehicle_breakdown
    ? Object.entries(stats.vehicle_breakdown).map(([k,v]) => ({ name: k.charAt(0).toUpperCase()+k.slice(1), value: v }))
    : [];

  const statusColor = (s) => ({ CRITICAL:"#ef4444", HIGH:"#f59e0b", MODERATE:"#06b6d4" }[s] || "#10b981");

  if (loading) return <div className="an-loading">Loading analytics...</div>;

  return (
    <div className="analytics-page">
      <div className="an-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Live traffic intelligence — updates after every video analysis</p>
        </div>
        <div className="an-right">
          {stats?.source === "video_analysis" && <span className="video-source-tag">📹 From Video</span>}
          <div className="timeframe-tabs">
            {["today","week","month"].map(t => (
              <button key={t} className={`tf-tab ${timeframe===t?"active":""}`} onClick={() => setTimeframe(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      {stats && (
        <div className="an-kpi-row">
          {[
            { label:"Total Vehicles",   value: stats.total_vehicles?.toLocaleString(), color:"#3b82f6" },
            { label:"Avg Density",      value: `${stats.average_density}%`,            color: statusColor(stats.traffic_status) },
            { label:"Traffic Status",   value: stats.traffic_status,                   color: statusColor(stats.traffic_status) },
            { label:"Avg Speed",        value: `${stats.average_speed} km/h`,          color:"#10b981" },
            { label:"Active Incidents", value: stats.active_incidents,                 color:"#f59e0b" },
            { label:"Signals Active",   value: stats.optimized_signals,                color:"#8b5cf6" },
          ].map((k,i) => (
            <div key={i} className="an-kpi" style={{borderTopColor:k.color}}>
              <div className="an-kpi-val" style={{color:k.color}}>{k.value}</div>
              <div className="an-kpi-lbl">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="an-charts-grid">
        {/* Density trend */}
        <div className="an-card wide">
          <div className="an-card-head"><h3>Traffic Density & Speed Trend</h3><span className="an-tag">Per Junction</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="name" stroke="#475569" tick={{fontSize:12}} />
              <YAxis stroke="#475569" tick={{fontSize:12}} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{fontSize:"13px",color:"#94a3b8"}} />
              <Area type="monotone" dataKey="density" stroke="#3B82F6" fill="url(#gd)" strokeWidth={2.5} name="Density %" />
              <Line type="monotone" dataKey="speed" stroke="#10B981" strokeWidth={2.5} dot={{r:3}} name="Speed km/h" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Congestion by zone */}
        <div className="an-card">
          <div className="an-card-head"><h3>Congestion by Junction</h3><span className="an-tag">Live</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="zone" stroke="#475569" tick={{fontSize:11}} />
              <YAxis stroke="#475569" tick={{fontSize:12}} />
              <Tooltip {...TT} />
              <Bar dataKey="congestion" radius={[6,6,0,0]} name="Density %">
                {zoneData.map((e,i) => <Cell key={i} fill={e.congestion>70?"#ef4444":e.congestion>45?"#f59e0b":"#10b981"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Predictions */}
        <div className="an-card">
          <div className="an-card-head"><h3>AI Congestion Predictions</h3><span className="an-tag">Forecast</span></div>
          <div className="predictions-list">
            {predictions.slice(0,8).map((p,i) => {
              const d = p.predicted_density || 0;
              const col = d>70?"#ef4444":d>50?"#f59e0b":"#10b981";
              return (
                <div key={i} className="pred-item">
                  <span className="pred-slot">{p.time_slot}</span>
                  <div className="pred-track"><div className="pred-fill" style={{width:`${d}%`,background:col}} /></div>
                  <span className="pred-pct" style={{color:col}}>{d}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle breakdown */}
        {vbData.length > 0 && (
          <div className="an-card">
            <div className="an-card-head"><h3>Vehicle Breakdown</h3><span className="an-tag">From Video</span></div>
            <div className="vb-breakdown">
              {vbData.map((v,i) => {
                const colors = ["#3b82f6","#10b981","#f59e0b","#8b5cf6"];
                const total = vbData.reduce((a,x) => a+x.value, 0) || 1;
                const pct = Math.round((v.value/total)*100);
                return (
                  <div key={i} className="vb-row-an">
                    <span className="vb-lbl-an" style={{color:colors[i]}}>{v.name}</span>
                    <div className="vb-track-an"><div className="vb-fill-an" style={{width:`${pct}%`,background:colors[i]}} /></div>
                    <span className="vb-count-an">{v.value}</span>
                    <span className="vb-pct-an" style={{color:colors[i]}}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Junction table */}
        <div className="an-card wide">
          <div className="an-card-head"><h3>Junction Performance</h3><span className="an-tag">Real-time</span></div>
          <div className="junc-table-wrap">
            <table className="junc-table">
              <thead><tr><th>Junction</th><th>Zone</th><th>Vehicles</th><th>Density</th><th>Congestion</th><th>Signal</th></tr></thead>
              <tbody>
                {junctions.map((j,i) => {
                  const level = j.density>70?"high":j.density>45?"medium":"low";
                  const sigCol = {green:"#10b981",yellow:"#f59e0b",red:"#ef4444"}[j.signal_status?.toLowerCase()] || "#10b981";
                  return (
                    <tr key={i}>
                      <td>{j.name}</td>
                      <td><span className="zone-tag">{j.zone}</span></td>
                      <td>{j.vehicle_count}</td>
                      <td>{j.density}%</td>
                      <td><span className={`badge badge-${level}`}>{level.toUpperCase()}</span></td>
                      <td><span className="sig-dot" style={{background:sigCol,boxShadow:`0 0 6px ${sigCol}`}} />{j.signal_status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="insights-row">
        <h3 className="insights-title">🧠 AI Insights</h3>
        <div className="insights-grid">
          {[
            { icon:"🚦", title:"Signal Optimization", desc: stats ? `${stats.optimized_signals} signals optimized. Avg density: ${stats.average_density}%` : "Loading...", color:"#3b82f6" },
            { icon:"⚠️", title:"Peak Hour Alert",     desc: stats?.traffic_status === "CRITICAL" ? "Critical congestion detected — immediate action required." : "Traffic within normal parameters.", color:"#f59e0b" },
            { icon:"🚑", title:"Emergency Readiness", desc:`${stats?.active_incidents || 0} active incidents. Emergency corridors on standby.`, color:"#10b981" },
          ].map((ins,i) => (
            <div key={i} className="insight-card" style={{borderTopColor:ins.color}}>
              <span className="insight-icon">{ins.icon}</span>
              <h4 className="insight-title">{ins.title}</h4>
              <p className="insight-desc">{ins.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
