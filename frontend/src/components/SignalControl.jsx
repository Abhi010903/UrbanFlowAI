import React, { useState, useEffect } from "react";
import { FiRefreshCw, FiCheck, FiX, FiZap } from "react-icons/fi";
import "./SignalControl.css";
import { signalsAPI } from "../services/api";

const SignalControl = () => {
  const [signals, setSignals] = useState([]);
  const [optimizing, setOptimizing] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => {
    fetchSignals();
    const iv = setInterval(fetchSignals, 5000);
    return () => clearInterval(iv);
  }, []);

  const fetchSignals = async () => {
    try { const r = await signalsAPI.getStatus(); if (r.signals) setSignals(r.signals); } catch {}
  };

  const handleOptimize = async (junctionId) => {
    setOptimizing(junctionId);
    try {
      const r = await signalsAPI.optimize(junctionId);
      addLog("success", `Signal optimized at ${junctionId}`);
      if (r.success) fetchSignals();
    } catch { addLog("error", `Failed to optimize ${junctionId}`); }
    finally { setOptimizing(null); }
  };

  const handleOptimizeAll = async () => {
    for (const s of signals) await handleOptimize(s.junction_id);
    addLog("success", "All signals optimized");
  };

  const addLog = (type, message) => {
    setLog(prev => [{ id: Date.now(), type, message, time: new Date() }, ...prev.slice(0, 9)]);
  };

  const getPhaseColor = (status) => ({ green: "#10b981", yellow: "#f59e0b", red: "#ef4444" }[status?.toLowerCase()] || "#475569");

  return (
    <div className="sc-page">
      <div className="sc-header">
        <div>
          <h1 className="page-title">Signal Control</h1>
          <p className="page-sub">Adaptive AI traffic signal optimization</p>
        </div>
        <div className="sc-actions">
          <button className={`mode-btn ${manualMode ? "manual" : "auto"}`} onClick={() => setManualMode(!manualMode)}>
            {manualMode ? "👤 Manual" : "🤖 Auto"}
          </button>
          <button className="btn-optimize-all" onClick={handleOptimizeAll} disabled={manualMode}>
            <FiZap size={16} /> Optimize All
          </button>
        </div>
      </div>

      <div className="sc-status-row">
        {[
          { label: "Mode", value: manualMode ? "MANUAL" : "AUTO", color: manualMode ? "#f59e0b" : "#10b981" },
          { label: "Total Signals", value: signals.length, color: "#3b82f6" },
          { label: "Optimization", value: "ACTIVE", color: "#10b981" },
          { label: "Updated", value: new Date().toLocaleTimeString(), color: "#8b5cf6" },
        ].map((s, i) => (
          <div key={i} className="sc-stat">
            <div className="sc-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="sc-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="sc-body">
        <div className="signals-grid">
          {signals.length > 0 ? signals.map((sig) => (
            <div key={sig.id || sig.junction_id} className="signal-card">
              <div className="signal-card-top">
                <div>
                  <h3 className="signal-name">{sig.junction_id}</h3>
                  <span className="signal-id">{sig.name || "Junction"}</span>
                </div>
                <div className="signal-light-wrap">
                  <div className="signal-light" style={{ background: getPhaseColor(sig.status), boxShadow: `0 0 12px ${getPhaseColor(sig.status)}` }} />
                </div>
              </div>

              <div className="timing-row">
                {[
                  { label: "Green", val: `${sig.green_time || 30}s`, color: "#10b981" },
                  { label: "Yellow", val: `${sig.yellow_time || 5}s`, color: "#f59e0b" },
                  { label: "Red", val: `${sig.red_time || 30}s`, color: "#ef4444" },
                ].map((t, i) => (
                  <div key={i} className="timing-item">
                    <span className="timing-val" style={{ color: t.color }}>{t.val}</span>
                    <span className="timing-lbl">{t.label}</span>
                  </div>
                ))}
              </div>

              <div className="signal-metrics">
                <div className="sig-metric"><span>{sig.vehicle_count || 0}</span><span>Vehicles</span></div>
                <div className="sig-metric"><span>{sig.density || 0}%</span><span>Density</span></div>
              </div>

              <button
                className="btn-optimize"
                onClick={() => handleOptimize(sig.junction_id)}
                disabled={manualMode || optimizing === sig.junction_id}
              >
                <FiRefreshCw size={14} className={optimizing === sig.junction_id ? "spin" : ""} />
                {optimizing === sig.junction_id ? "Optimizing..." : "Optimize"}
              </button>
            </div>
          )) : (
            <div className="empty-state">No signal data available</div>
          )}
        </div>

        <div className="log-panel">
          <h3>Activity Log</h3>
          <div className="log-list">
            {log.length > 0 ? log.map((e) => (
              <div key={e.id} className={`log-entry log-${e.type}`}>
                <span className="log-icon">{e.type === "success" ? <FiCheck size={14} /> : <FiX size={14} />}</span>
                <div className="log-body">
                  <p className="log-msg">{e.message}</p>
                  <p className="log-time">{e.time.toLocaleTimeString()}</p>
                </div>
              </div>
            )) : <p className="empty-state">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalControl;
