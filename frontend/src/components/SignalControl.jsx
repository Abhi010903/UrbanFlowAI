import React, { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiCheck, FiX, FiZap } from "react-icons/fi";
import "./SignalControl.css";
import { signalsAPI } from "../services/api";

const PHASE_COLOR = { green:"#10b981", yellow:"#f59e0b", red:"#ef4444" };

export default function SignalControl() {
  const [signals,    setSignals]    = useState([]);
  const [optimizing, setOptimizing] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [log,        setLog]        = useState([]);
  const [ticks,      setTicks]      = useState(0);
  const wsRef = useRef(null);

  // Fetch signals
  const fetchSignals = async () => {
    try { const r = await signalsAPI.getStatus(); if (r.signals) setSignals(r.signals); } catch {}
  };

  useEffect(() => {
    fetchSignals();
    // WebSocket for live signal ticks
    try {
      wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws/live-updates");
      wsRef.current.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.signals) setSignals(d.signals);
        } catch {}
      };
    } catch {}
    // Local countdown tick every second
    const iv = setInterval(() => setTicks(t => t + 1), 1000);
    return () => { clearInterval(iv); wsRef.current?.close(); };
  }, []);

  // Decrement time_remaining locally every tick
  useEffect(() => {
    setSignals(prev => prev.map(s => {
      const tr = Math.max(0, (s.time_remaining || 0) - 1);
      if (tr === 0) {
        const cycle = ["green","yellow","red"];
        const idx = cycle.indexOf(s.status);
        const next = cycle[(idx + 1) % 3];
        const times = { green: s.green_time||30, yellow: s.yellow_time||5, red: s.red_time||30 };
        return { ...s, status: next, time_remaining: times[next] };
      }
      return { ...s, time_remaining: tr };
    }));
  }, [ticks]);

  const handleOptimize = async (junctionId) => {
    if (manualMode) return;
    setOptimizing(junctionId);
    try {
      const r = await signalsAPI.optimize(junctionId);
      addLog("success", `Signal optimized at ${junctionId}`);
      if (r.success) fetchSignals();
    } catch { addLog("error", `Failed to optimize ${junctionId}`); }
    finally { setOptimizing(null); }
  };

  const handleOptimizeAll = async () => {
    if (manualMode) return;
    setOptimizing("ALL");
    try {
      await signalsAPI.optimizeAll();
      addLog("success", "All signals optimized via AI");
      fetchSignals();
    } catch { addLog("error", "Bulk optimization failed"); }
    finally { setOptimizing(null); }
  };

  const addLog = (type, message) => {
    setLog(prev => [{ id: Date.now(), type, message, time: new Date() }, ...prev.slice(0, 14)]);
  };

  const activeCount  = signals.filter(s => s.status === "green").length;
  const avgDensity   = signals.length ? Math.round(signals.reduce((a,s) => a + (s.density||0), 0) / signals.length) : 0;
  const totalVehicles = signals.reduce((a,s) => a + (s.vehicle_count||0), 0);

  return (
    <div className="sc-page">
      <div className="sc-header">
        <div>
          <h1 className="page-title">Signal Control</h1>
          <p className="page-sub">Adaptive AI traffic signal optimization — live from video analysis</p>
        </div>
        <div className="sc-actions">
          <button className={`mode-btn ${manualMode ? "manual" : "auto"}`} onClick={() => setManualMode(!manualMode)}>
            {manualMode ? "👤 Manual" : "🤖 Auto"}
          </button>
          <button className="btn-optimize-all" onClick={handleOptimizeAll} disabled={manualMode || optimizing === "ALL"}>
            <FiZap size={15} />{optimizing === "ALL" ? "Optimizing..." : "Optimize All"}
          </button>
        </div>
      </div>

      <div className="sc-status-row">
        {[
          { label:"Mode",           value: manualMode ? "MANUAL" : "AUTO",  color: manualMode ? "#f59e0b" : "#10b981" },
          { label:"Total Signals",  value: signals.length,                   color:"#3b82f6" },
          { label:"Green Now",      value: activeCount,                      color:"#10b981" },
          { label:"Total Vehicles", value: totalVehicles,                    color:"#8b5cf6" },
          { label:"Avg Density",    value: `${avgDensity}%`,                 color: avgDensity > 70 ? "#ef4444" : avgDensity > 45 ? "#f59e0b" : "#10b981" },
        ].map((s,i) => (
          <div key={i} className="sc-stat">
            <div className="sc-stat-val" style={{color:s.color}}>{s.value}</div>
            <div className="sc-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="sc-body">
        <div className="signals-grid">
          {signals.map((sig) => {
            const col = PHASE_COLOR[sig.status] || "#475569";
            const pct = sig.time_remaining / (sig.status === "green" ? sig.green_time : sig.status === "yellow" ? sig.yellow_time : sig.red_time) * 100;
            return (
              <div key={sig.id || sig.junction_id} className="signal-card">
                <div className="signal-card-top">
                  <div>
                    <h3 className="signal-name">{sig.name || sig.junction_id}</h3>
                    <span className="signal-id">{sig.junction_id}</span>
                  </div>
                  <div className="signal-light-wrap">
                    <div className="signal-light" style={{ background: col, boxShadow:`0 0 14px ${col}` }} />
                    <span className="signal-phase-label" style={{color: col}}>{sig.status?.toUpperCase()}</span>
                  </div>
                </div>

                {/* Countdown ring */}
                <div className="countdown-wrap">
                  <svg className="countdown-ring" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="5" />
                    <circle cx="30" cy="30" r="26" fill="none" stroke={col} strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(pct,100)/100)}`}
                      strokeLinecap="round" transform="rotate(-90 30 30)"
                      style={{transition:"stroke-dashoffset 0.9s linear"}}
                    />
                    <text x="30" y="35" textAnchor="middle" fill={col} fontSize="14" fontWeight="800">{sig.time_remaining}s</text>
                  </svg>
                  <span className="countdown-phase">{sig.current_phase || "Phase"}</span>
                </div>

                <div className="timing-row">
                  {[
                    { label:"Green", val:`${sig.green_time||30}s`,  color:"#10b981" },
                    { label:"Yellow",val:`${sig.yellow_time||5}s`,  color:"#f59e0b" },
                    { label:"Red",   val:`${sig.red_time||30}s`,    color:"#ef4444" },
                  ].map((t,i) => (
                    <div key={i} className="timing-item">
                      <span className="timing-val" style={{color:t.color}}>{t.val}</span>
                      <span className="timing-lbl">{t.label}</span>
                    </div>
                  ))}
                </div>

                <div className="signal-metrics">
                  <div className="sig-metric"><span>{sig.vehicle_count||0}</span><span>Vehicles</span></div>
                  <div className="sig-metric"><span>{sig.density||0}%</span><span>Density</span></div>
                </div>

                <button className="btn-optimize" onClick={() => handleOptimize(sig.junction_id)} disabled={manualMode || optimizing === sig.junction_id}>
                  <FiRefreshCw size={13} className={optimizing === sig.junction_id ? "spin" : ""} />
                  {optimizing === sig.junction_id ? "Optimizing..." : "Optimize"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="log-panel">
          <h3>Activity Log</h3>
          <div className="log-list">
            {log.length > 0 ? log.map(e => (
              <div key={e.id} className={`log-entry log-${e.type}`}>
                <span className="log-icon">{e.type === "success" ? <FiCheck size={13}/> : <FiX size={13}/>}</span>
                <div className="log-body">
                  <p className="log-msg">{e.message}</p>
                  <p className="log-time">{e.time.toLocaleTimeString()}</p>
                </div>
              </div>
            )) : <p className="empty-state">No activity yet — optimize a signal</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
