import React, { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { FiTrendingUp, FiAlertTriangle, FiActivity, FiZap, FiEye, FiCpu } from "react-icons/fi";
import "./Dashboard.css";
import { trafficAPI, analyticsAPI } from "../services/api";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

const trendData = [
  { time: "6 AM", density: 35 }, { time: "8 AM", density: 70 },
  { time: "10 AM", density: 55 }, { time: "12 PM", density: 60 },
  { time: "2 PM", density: 72 }, { time: "4 PM", density: 82 },
  { time: "6 PM", density: 91 }, { time: "8 PM", density: 58 },
];

const zoneData = [
  { zone: "Central", congestion: 82 }, { zone: "North", congestion: 58 },
  { zone: "South", congestion: 44 }, { zone: "East", congestion: 76 },
  { zone: "West", congestion: 61 },
];

const tooltipStyle = {
  contentStyle: { background: "rgba(5,12,30,0.97)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", color: "#f0f6ff", fontSize: "13px" },
  cursor: { stroke: "rgba(59,130,246,0.2)" },
};

const statusColor = (s) => ({ CRITICAL: "#ef4444", HIGH: "#f59e0b", MODERATE: "#06b6d4" }[s] || "#10b981");

const KpiCard = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="kpi-card">
    <div className="kpi-top">
      <span className="kpi-label">{title}</span>
      <span className="kpi-icon" style={{ color }}><Icon size={18} /></span>
    </div>
    <div className="kpi-value" style={{ color }}>{value}</div>
    <div className="kpi-sub" style={{ color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b" }}>{sub}</div>
    <div className="kpi-glow" style={{ background: color }} />
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ totalVehicles: 0, averageDensity: 0, activeIncidents: 0, optimizedSignals: 0, trafficStatus: "NORMAL" });
  const [trafficData, setTrafficData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, []);

  const fetchData = async () => {
    try {
      const [s, t] = await Promise.all([analyticsAPI.getStatistics(), trafficAPI.getLiveTraffic()]);
      if (s.data) {
        const d = Number(s.data.average_density || 0).toFixed(1);
        let status = "NORMAL";
        if (d > 80) status = "CRITICAL"; else if (d > 60) status = "HIGH"; else if (d > 40) status = "MODERATE";
        setStats({ totalVehicles: s.data.total_vehicles || 0, averageDensity: d, activeIncidents: s.data.active_incidents || 0, optimizedSignals: s.data.optimized_signals || 0, trafficStatus: status });
      }
      if (t.data) {
        setTrafficData(t.data);
        const total = t.data.reduce((a, j) => a + (j.vehicle_count || 0), 0);
        setVehicleData([
          { name: "Cars", value: Math.floor(total * 0.6) },
          { name: "Bikes", value: Math.floor(total * 0.2) },
          { name: "Buses", value: Math.floor(total * 0.1) },
          { name: "Trucks", value: Math.floor(total * 0.1) },
        ]);
      }
    } catch {}
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Dashboard</h1>
            <p>Smart Traffic Monitoring & Real-time Analytics</p>
          </div>
          <div className="live-badge">
            <span className="live-dot" />
            Live System
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Total Vehicles" value={stats.totalVehicles.toLocaleString()} sub="+2.5% from last hour" icon={FiActivity} color="#3b82f6" trend="up" />
        <KpiCard title="Avg. Density" value={`${stats.averageDensity}%`} sub={stats.trafficStatus} icon={FiCpu} color={statusColor(stats.trafficStatus)} />
        <KpiCard title="Active Incidents" value={stats.activeIncidents} sub="Requiring attention" icon={FiAlertTriangle} color="#f59e0b" />
        <KpiCard title="Optimized Signals" value={stats.optimizedSignals} sub="Operating efficiently" icon={FiZap} color="#10b981" trend="up" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-head">
            <h3>Traffic Density Trend</h3>
            <span className="chart-tag">24-hour</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="density" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: "#3B82F6", r: 3 }} activeDot={{ r: 5, fill: "#60a5fa" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <h3>Congestion by Zone</h3>
            <span className="chart-tag">Current</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="zone" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="congestion" radius={[6, 6, 0, 0]}>
                {zoneData.map((e, i) => (
                  <Cell key={i} fill={e.congestion > 75 ? "#ef4444" : e.congestion > 55 ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <h3>Vehicle Distribution</h3>
            <span className="chart-tag">By type</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vehicleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {vehicleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "13px", color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <h3>Junction Status</h3>
            <span className="chart-tag">Real-time</span>
          </div>
          <div className="junction-table-wrap">
            <table className="junction-table">
              <thead>
                <tr><th>Junction</th><th>Vehicles</th><th>Density</th><th>Status</th></tr>
              </thead>
              <tbody>
                {trafficData.slice(0, 6).map((j, i) => {
                  const d = j.density || 0;
                  const level = d > 70 ? "high" : d > 40 ? "medium" : "low";
                  return (
                    <tr key={i}>
                      <td>{j.junction_id || `Junction ${i + 1}`}</td>
                      <td>{j.vehicle_count || 0}</td>
                      <td>{d}%</td>
                      <td><span className={`badge badge-${level}`}>{level.toUpperCase()}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="activity-card">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {[
            { icon: "🚦", text: "Signal optimization completed at Junction A", time: "2m ago", color: "#3b82f6" },
            { icon: "⚠️", text: "Congestion detected at Central Zone", time: "5m ago", color: "#f59e0b" },
            { icon: "🚑", text: "Emergency corridor activated — Route J1→J8", time: "12m ago", color: "#ef4444" },
            { icon: "📈", text: "Predictive analysis model updated", time: "18m ago", color: "#10b981" },
          ].map((a, i) => (
            <div key={i} className="activity-item" style={{ borderLeftColor: a.color }}>
              <span className="activity-icon">{a.icon}</span>
              <span className="activity-text">{a.text}</span>
              <span className="activity-time">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
