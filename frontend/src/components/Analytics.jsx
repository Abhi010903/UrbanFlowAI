import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Analytics.css";
import { analyticsAPI } from "../services/api";

const tooltip = {
  contentStyle: { background: "rgba(5,12,30,0.97)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", color: "#f0f6ff", fontSize: "13px" },
};

const trendData = [
  { hour: "6 AM", density: 35, avgSpeed: 45 }, { hour: "9 AM", density: 72, avgSpeed: 32 },
  { hour: "12 PM", density: 58, avgSpeed: 38 }, { hour: "3 PM", density: 65, avgSpeed: 35 },
  { hour: "6 PM", density: 85, avgSpeed: 28 }, { hour: "9 PM", density: 45, avgSpeed: 42 },
];

const speedData = [
  { zone: "Central", speed: 25 }, { zone: "North", speed: 38 },
  { zone: "South", speed: 32 }, { zone: "East", speed: 42 }, { zone: "West", speed: 36 },
];

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("today");
  const [predictions, setPredictions] = useState([]);
  const [loadingPred, setLoadingPred] = useState(false);

  useEffect(() => {
    fetchPredictions(1);
  }, []);

  const fetchPredictions = async (hours) => {
    setLoadingPred(true);
    try {
      const r = await analyticsAPI.getPredictions();
      if (r.prediction) setPredictions(r.prediction);
    } catch {} finally { setLoadingPred(false); }
  };

  const metrics = [
    { label: "Avg Traffic Density", value: "62%", color: "#3b82f6" },
    { label: "Avg Vehicle Speed", value: "34.6 km/h", color: "#10b981" },
    { label: "Peak Hour", value: "6:00 PM", color: "#f59e0b" },
    { label: "Optimization Efficiency", value: "87%", color: "#8b5cf6" },
  ];

  const insights = [
    { icon: "🚦", title: "Signal Optimization Active", desc: "AI reduced average waiting time by 18%.", color: "#3b82f6" },
    { icon: "⚠️", title: "Peak Hour Alert", desc: "Heavy traffic expected near Railway Junction.", color: "#f59e0b" },
    { icon: "🚑", title: "Emergency Route Efficiency", desc: "Emergency corridor response improved significantly.", color: "#10b981" },
  ];

  return (
    <div className="analytics-page">
      <div className="an-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Traffic patterns, predictions & AI insights</p>
        </div>
        <div className="timeframe-tabs">
          {["today", "week", "month"].map((t) => (
            <button key={t} className={`tf-tab ${timeframe === t ? "active" : ""}`} onClick={() => setTimeframe(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="an-charts-grid">
        <div className="an-card wide">
          <div className="an-card-head"><h3>Traffic Trend</h3><span className="an-tag">Hourly</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip {...tooltip} />
              <Legend wrapperStyle={{ fontSize: "13px", color: "#94a3b8" }} />
              <Line type="monotone" dataKey="density" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="Density %" />
              <Line type="monotone" dataKey="avgSpeed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Avg Speed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="an-card">
          <div className="an-card-head"><h3>Speed by Zone</h3><span className="an-tag">km/h</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="zone" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip {...tooltip} />
              <Bar dataKey="speed" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="an-card">
          <div className="an-card-head"><h3>Key Metrics</h3><span className="an-tag">Summary</span></div>
          <div className="metrics-list">
            {metrics.map((m, i) => (
              <div key={i} className="metric-row">
                <span className="metric-lbl">{m.label}</span>
                <span className="metric-val" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="an-card">
          <div className="an-card-head">
            <h3>AI Congestion Predictions</h3>
            <div className="pred-btns">
              {[1, 3, 6].map((h) => (
                <button key={h} className="pred-btn" onClick={() => fetchPredictions(h)} disabled={loadingPred}>
                  +{h}h
                </button>
              ))}
            </div>
          </div>
          <div className="predictions-list">
            {loadingPred ? <p className="loading-text">Running AI model...</p> :
              Array.isArray(predictions) && predictions.length > 0 ? predictions.map((p, i) => {
                const d = p.predicted_density || 0;
                const color = d > 70 ? "#ef4444" : d > 50 ? "#f59e0b" : "#10b981";
                return (
                  <div key={i} className="pred-item">
                    <span className="pred-slot">{p.time_slot || `Slot ${i + 1}`}</span>
                    <div className="pred-track"><div className="pred-fill" style={{ width: `${d}%`, background: color }} /></div>
                    <span className="pred-pct" style={{ color }}>{d}%</span>
                  </div>
                );
              }) : <p className="loading-text">Click a button to predict</p>
            }
          </div>
        </div>
      </div>

      <div className="insights-row">
        <h3 className="insights-title">🧠 AI Insights</h3>
        <div className="insights-grid">
          {insights.map((ins, i) => (
            <div key={i} className="insight-card" style={{ borderTopColor: ins.color }}>
              <span className="insight-icon">{ins.icon}</span>
              <h4 className="insight-title">{ins.title}</h4>
              <p className="insight-desc">{ins.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
