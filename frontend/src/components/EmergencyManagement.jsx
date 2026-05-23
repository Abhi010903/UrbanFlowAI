import React, { useState, useEffect } from "react";
import { FiPlay, FiPause, FiTrash2, FiPlus } from "react-icons/fi";
import "./EmergencyManagement.css";
import { emergencyAPI } from "../services/api";

const ICONS = { ambulance:"🚑", fire_truck:"🚒", police:"🚓" };

export default function EmergencyManagement() {
  const [corridors, setCorridors] = useState([]);
  const [form,      setForm]      = useState({ vehicleType:"ambulance", priority:"1", startLat:"", startLng:"", destLat:"", destLng:"" });
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState([]);
  const [stats,     setStats]     = useState({ active:0, today:0, avgSaved:"3.5 min" });

  const fetchCorridors = async () => {
    try { const r = await emergencyAPI.getCorridors(); if (r.success) setCorridors(r.corridors); } catch {}
  };

  useEffect(() => { fetchCorridors(); const iv = setInterval(fetchCorridors, 5000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    setStats({ active: corridors.filter(c => c.status === "ACTIVE").length, today: corridors.length, avgSaved: "3.5 min" });
  }, [corridors]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await emergencyAPI.createCorridor({
        vehicleType: form.vehicleType, priority: parseInt(form.priority),
        startLat: parseFloat(form.startLat), startLng: parseFloat(form.startLng),
        destLat:  parseFloat(form.destLat),  destLng:  parseFloat(form.destLng),
      });
      if (r.success) {
        addHistory(`Green corridor activated for ${form.vehicleType}`, "create");
        setForm({ vehicleType:"ambulance", priority:"1", startLat:"", startLng:"", destLat:"", destLng:"" });
        setShowForm(false);
        fetchCorridors();
      }
    } catch (err) { addHistory("Failed to create corridor", "error"); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try { await emergencyAPI.toggleCorridor(id); fetchCorridors(); } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await emergencyAPI.deleteCorridor(id);
      addHistory(`Corridor ${id} closed`, "close");
      fetchCorridors();
    } catch {}
  };

  const addHistory = (msg, type) => setHistory(prev => [{ id:Date.now(), msg, type, time:new Date() }, ...prev.slice(0,9)]);

  return (
    <div className="em-page">
      <div className="em-header">
        <div>
          <h1 className="page-title">Emergency Management</h1>
          <p className="page-sub">AI-powered green corridor activation & emergency routing</p>
        </div>
        <button className="btn-new-corridor" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={16} /> New Corridor
        </button>
      </div>

      <div className="em-stats-row">
        {[
          { label:"Active Corridors",  value: stats.active,   color:"#ef4444" },
          { label:"Total Today",       value: stats.today,    color:"#3b82f6" },
          { label:"Avg Time Saved",    value: stats.avgSaved, color:"#10b981" },
          { label:"Signals Synced",    value: corridors.reduce((a,c) => a+(c.signals_synced||0),0), color:"#8b5cf6" },
        ].map((s,i) => (
          <div key={i} className="em-stat" style={{borderTopColor:s.color}}>
            <div className="em-stat-val" style={{color:s.color}}>{s.value}</div>
            <div className="em-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="em-form-card">
          <h3>🚦 Activate Green Corridor</h3>
          <form onSubmit={handleCreate} className="em-form">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={form.vehicleType} onChange={e => setForm(p=>({...p,vehicleType:e.target.value}))}>
                  <option value="ambulance">🚑 Ambulance</option>
                  <option value="fire_truck">🚒 Fire Truck</option>
                  <option value="police">🚓 Police</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
                  <option value="1">🔴 Critical</option>
                  <option value="2">🟠 High</option>
                  <option value="3">🟡 Medium</option>
                </select>
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Start Latitude</label><input className="form-input" type="number" step="0.0001" placeholder="23.0225" value={form.startLat} onChange={e=>setForm(p=>({...p,startLat:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Start Longitude</label><input className="form-input" type="number" step="0.0001" placeholder="72.5714" value={form.startLng} onChange={e=>setForm(p=>({...p,startLng:e.target.value}))} required /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Dest Latitude</label><input className="form-input" type="number" step="0.0001" placeholder="23.0505" value={form.destLat} onChange={e=>setForm(p=>({...p,destLat:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Dest Longitude</label><input className="form-input" type="number" step="0.0001" placeholder="72.6010" value={form.destLng} onChange={e=>setForm(p=>({...p,destLng:e.target.value}))} required /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-activate" disabled={loading}>{loading ? "Activating..." : "🚦 Activate Green Corridor"}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="em-body">
        <div className="corridors-section">
          <h3 className="section-title">Active Corridors</h3>
          {corridors.length === 0
            ? <div className="empty-state">No corridors active — create one above</div>
            : corridors.map(c => (
              <div key={c.corridor_id} className={`corridor-card ${c.status === "ACTIVE" ? "active" : "paused"}`}>
                <div className="corridor-top">
                  <div className="corridor-vehicle">
                    <span className="vehicle-emoji">{ICONS[c.vehicle_type] || "🚨"}</span>
                    <div>
                      <p className="vehicle-type">{c.vehicle_type?.replace("_"," ").toUpperCase()}</p>
                      <p className="corridor-id">{c.corridor_id}</p>
                    </div>
                  </div>
                  <span className={`status-chip ${c.status==="ACTIVE"?"chip-active":"chip-paused"}`}>{c.status}</span>
                </div>

                {/* Route path */}
                {c.route?.path && (
                  <div className="route-path-row">
                    {c.route.path.map((p,i) => (
                      <React.Fragment key={i}>
                        <span className="route-node">{p}</span>
                        {i < c.route.path.length-1 && <span className="route-arrow">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <div className="corridor-metrics">
                  <div className="cm-item"><span className="cm-lbl">ETA</span><span className="cm-val eta">{c.eta} min</span></div>
                  <div className="cm-item"><span className="cm-lbl">Signals Synced</span><span className="cm-val">{c.signals_synced || 0}</span></div>
                  <div className="cm-item"><span className="cm-lbl">Priority</span><span className="cm-val">{c.priority === 1 ? "🔴 Critical" : c.priority === 2 ? "🟠 High" : "🟡 Medium"}</span></div>
                  {c.route?.estimated_distance_km && <div className="cm-item"><span className="cm-lbl">Distance</span><span className="cm-val">{c.route.estimated_distance_km} km</span></div>}
                </div>

                <div className="corridor-actions">
                  <button className="btn-toggle" onClick={() => handleToggle(c.corridor_id)}>
                    {c.status === "ACTIVE" ? <><FiPause size={13}/> Pause</> : <><FiPlay size={13}/> Resume</>}
                  </button>
                  <button className="btn-remove" onClick={() => handleDelete(c.corridor_id)}>
                    <FiTrash2 size={13}/> Close
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div className="history-panel">
          <h3 className="section-title">Activity History</h3>
          {history.length > 0 ? history.map(h => (
            <div key={h.id} className={`history-item ${h.type}`}>
              <span className="history-dot" />
              <div><p className="history-msg">{h.msg}</p><p className="history-time">{h.time.toLocaleTimeString()}</p></div>
            </div>
          )) : <p className="empty-state">No activity yet</p>}
        </div>
      </div>
    </div>
  );
}
