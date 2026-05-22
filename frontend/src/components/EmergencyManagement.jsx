import React, { useState } from "react";
import { FiPlay, FiPause, FiTrash2, FiPlus } from "react-icons/fi";
import "./EmergencyManagement.css";

const VEHICLE_ICONS = { ambulance: "🚑", fire_truck: "🚒", police: "🚓" };

const EmergencyManagement = () => {
  const [corridors, setCorridors] = useState([
    { corridor_id: "CORRIDOR_001", vehicle_type: "ambulance", status: "ACTIVE", startLat: 19.076, startLng: 72.8777, destLat: 19.085, destLng: 72.885, eta: 5 },
    { corridor_id: "CORRIDOR_002", vehicle_type: "fire_truck", status: "PAUSED", startLat: 19.080, startLng: 72.88, destLat: 19.090, destLng: 72.895, eta: 8 },
  ]);
  const [form, setForm] = useState({ vehicleType: "ambulance", priority: "1", startLat: "", startLng: "", destLat: "", destLng: "" });
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    const c = { corridor_id: `CORRIDOR_${Date.now()}`, vehicle_type: form.vehicleType, status: "ACTIVE", startLat: +form.startLat, startLng: +form.startLng, destLat: +form.destLat, destLng: +form.destLng, eta: Math.floor(Math.random() * 12) + 3 };
    setCorridors(prev => [c, ...prev]);
    setHistory(prev => [{ id: Date.now(), msg: `Corridor created for ${form.vehicleType}`, time: new Date(), type: "create" }, ...prev.slice(0, 9)]);
    setForm({ vehicleType: "ambulance", priority: "1", startLat: "", startLng: "", destLat: "", destLng: "" });
    setShowForm(false);
  };

  const toggle = (id) => setCorridors(prev => prev.map(c => c.corridor_id === id ? { ...c, status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : c));
  const remove = (id) => {
    setCorridors(prev => prev.filter(c => c.corridor_id !== id));
    setHistory(prev => [{ id: Date.now(), msg: `Corridor ${id} closed`, time: new Date(), type: "close" }, ...prev.slice(0, 9)]);
  };

  const active = corridors.filter(c => c.status === "ACTIVE").length;

  return (
    <div className="em-page">
      <div className="em-header">
        <div>
          <h1 className="page-title">Emergency Management</h1>
          <p className="page-sub">Create and manage emergency green corridors</p>
        </div>
        <button className="btn-new-corridor" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={16} /> New Corridor
        </button>
      </div>

      <div className="em-stats-row">
        {[
          { label: "Active Corridors", value: active, color: "#ef4444" },
          { label: "Total Today", value: corridors.length, color: "#3b82f6" },
          { label: "Avg Time Saved", value: "3.5 min", color: "#10b981" },
          { label: "Responses", value: history.length, color: "#8b5cf6" },
        ].map((s, i) => (
          <div key={i} className="em-stat" style={{ borderTopColor: s.color }}>
            <div className="em-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="em-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="em-form-card">
          <h3>Activate Green Corridor</h3>
          <form onSubmit={handleCreate} className="em-form">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}>
                  <option value="ambulance">🚑 Ambulance</option>
                  <option value="fire_truck">🚒 Fire Truck</option>
                  <option value="police">🚓 Police</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="1">🔴 Critical</option>
                  <option value="2">🟠 High</option>
                  <option value="3">🟡 Medium</option>
                </select>
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Start Latitude</label><input className="form-input" type="number" step="0.0001" placeholder="19.0760" value={form.startLat} onChange={e => setForm(p => ({ ...p, startLat: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Start Longitude</label><input className="form-input" type="number" step="0.0001" placeholder="72.8777" value={form.startLng} onChange={e => setForm(p => ({ ...p, startLng: e.target.value }))} required /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Dest Latitude</label><input className="form-input" type="number" step="0.0001" placeholder="19.0850" value={form.destLat} onChange={e => setForm(p => ({ ...p, destLat: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Dest Longitude</label><input className="form-input" type="number" step="0.0001" placeholder="72.8850" value={form.destLng} onChange={e => setForm(p => ({ ...p, destLng: e.target.value }))} required /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-activate">🚦 Activate Corridor</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="em-body">
        <div className="corridors-section">
          <h3 className="section-title">Active Corridors</h3>
          <div className="corridors-list">
            {corridors.length > 0 ? corridors.map((c) => (
              <div key={c.corridor_id} className={`corridor-card ${c.status === "ACTIVE" ? "active" : "paused"}`}>
                <div className="corridor-top">
                  <div className="corridor-vehicle">
                    <span className="vehicle-emoji">{VEHICLE_ICONS[c.vehicle_type] || "🚨"}</span>
                    <div>
                      <p className="vehicle-type">{c.vehicle_type.replace("_", " ").toUpperCase()}</p>
                      <p className="corridor-id">{c.corridor_id}</p>
                    </div>
                  </div>
                  <span className={`status-chip ${c.status === "ACTIVE" ? "chip-active" : "chip-paused"}`}>{c.status}</span>
                </div>
                <div className="corridor-coords">
                  <div className="coord-item"><span className="coord-lbl">From</span><span className="coord-val">{c.startLat.toFixed(4)}, {c.startLng.toFixed(4)}</span></div>
                  <div className="coord-arrow">→</div>
                  <div className="coord-item"><span className="coord-lbl">To</span><span className="coord-val">{c.destLat.toFixed(4)}, {c.destLng.toFixed(4)}</span></div>
                  <div className="coord-item"><span className="coord-lbl">ETA</span><span className="coord-val eta">{c.eta} min</span></div>
                </div>
                <div className="corridor-actions">
                  <button className="btn-toggle" onClick={() => toggle(c.corridor_id)}>
                    {c.status === "ACTIVE" ? <><FiPause size={14} /> Pause</> : <><FiPlay size={14} /> Resume</>}
                  </button>
                  <button className="btn-remove" onClick={() => remove(c.corridor_id)}>
                    <FiTrash2 size={14} /> Close
                  </button>
                </div>
              </div>
            )) : <div className="empty-state">No active corridors</div>}
          </div>
        </div>

        <div className="history-panel">
          <h3 className="section-title">Activity History</h3>
          <div className="history-list">
            {history.length > 0 ? history.map((h) => (
              <div key={h.id} className={`history-item ${h.type}`}>
                <span className="history-dot" />
                <div><p className="history-msg">{h.msg}</p><p className="history-time">{h.time.toLocaleTimeString()}</p></div>
              </div>
            )) : <p className="empty-state">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyManagement;
