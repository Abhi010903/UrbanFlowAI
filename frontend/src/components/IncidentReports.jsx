import React, { useState } from "react";
import { FiCheck, FiAlertTriangle, FiClock, FiTrash2, FiPlus } from "react-icons/fi";
import "./IncidentReports.css";

const TYPE_ICONS = { accident: "🚗💥", congestion: "🚦", roadwork: "🚧", breakdown: "🔧", weather: "🌧️" };

const IncidentReports = () => {
  const [incidents, setIncidents] = useState([
    { id: 1, junctionId: "Junction A", type: "accident", severity: "high", description: "Multi-vehicle collision blocking left lane", location: "19.0760, 72.8777", timestamp: new Date(Date.now() - 5 * 60000), status: "reported" },
    { id: 2, junctionId: "Junction C", type: "congestion", severity: "medium", description: "Unexpected traffic buildup near signal", location: "19.0745, 72.8700", timestamp: new Date(Date.now() - 15 * 60000), status: "resolved" },
    { id: 3, junctionId: "Junction E", type: "roadwork", severity: "low", description: "Scheduled maintenance on east lane", location: "19.0780, 72.8820", timestamp: new Date(Date.now() - 60 * 60000), status: "reported" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ junctionId: "", type: "accident", severity: "medium", description: "", location: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIncidents(prev => [{ id: Date.now(), ...form, timestamp: new Date(), status: "reported" }, ...prev]);
    setForm({ junctionId: "", type: "accident", severity: "medium", description: "", location: "" });
    setShowForm(false);
  };

  const updateStatus = (id, s) => setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
  const deleteIncident = (id) => setIncidents(prev => prev.filter(i => i.id !== id));

  const filtered = filter === "all" ? incidents : incidents.filter(i => i.status === filter);
  const counts = { all: incidents.length, reported: incidents.filter(i => i.status === "reported").length, resolved: incidents.filter(i => i.status === "resolved").length };

  const severityColor = (s) => ({ high: "#ef4444", medium: "#f59e0b", low: "#10b981" }[s] || "#64748b");

  return (
    <div className="ir-page">
      <div className="ir-header">
        <div>
          <h1 className="page-title">Incident Reports</h1>
          <p className="page-sub">Manage and track traffic incidents</p>
        </div>
        <button className="btn-new-incident" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={16} /> New Report
        </button>
      </div>

      <div className="ir-stats-row">
        {[
          { label: "Total", value: counts.all, color: "#3b82f6" },
          { label: "Active", value: counts.reported, color: "#ef4444" },
          { label: "Resolved", value: counts.resolved, color: "#10b981" },
          { label: "Avg Response", value: "18 min", color: "#8b5cf6" },
        ].map((s, i) => (
          <div key={i} className="ir-stat" style={{ borderTopColor: s.color }}>
            <div className="ir-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="ir-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="ir-form-card">
          <h3>Report New Incident</h3>
          <form onSubmit={handleSubmit} className="ir-form">
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Junction ID</label><input className="form-input" type="text" placeholder="e.g., Junction A" value={form.junctionId} onChange={e => setForm(p => ({ ...p, junctionId: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" type="text" placeholder="19.0760, 72.8777" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="accident">Accident</option>
                  <option value="congestion">Congestion</option>
                  <option value="roadwork">Road Work</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="weather">Weather</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-select" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows="3" placeholder="Describe the incident..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required /></div>
            <div className="form-actions">
              <button type="submit" className="btn-submit-report">Submit Report</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-tabs">
        {["all", "reported", "resolved"].map((f) => (
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      <div className="incidents-list">
        {filtered.length > 0 ? filtered.map((inc) => (
          <div key={inc.id} className={`incident-card sev-${inc.severity}`}>
            <div className="inc-header">
              <div className="inc-title">
                <span className="inc-type-icon">{TYPE_ICONS[inc.type] || "⚠️"}</span>
                <div>
                  <h3 className="inc-junction">{inc.junctionId}</h3>
                  <span className="inc-type">{inc.type.toUpperCase()}</span>
                </div>
              </div>
              <div className="inc-badges">
                <span className="sev-badge" style={{ color: severityColor(inc.severity), borderColor: severityColor(inc.severity), background: `${severityColor(inc.severity)}18` }}>{inc.severity.toUpperCase()}</span>
                <span className={`status-badge status-${inc.status}`}>{inc.status.toUpperCase()}</span>
              </div>
            </div>
            <p className="inc-desc">{inc.description}</p>
            <div className="inc-footer">
              <span className="inc-loc">📍 {inc.location}</span>
              <span className="inc-time">{inc.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="inc-actions">
              {inc.status === "reported" && (
                <button className="btn-resolve" onClick={() => updateStatus(inc.id, "resolved")}>
                  <FiCheck size={14} /> Mark Resolved
                </button>
              )}
              <button className="btn-delete" onClick={() => deleteIncident(inc.id)}>
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )) : <div className="empty-state">No incidents found</div>}
      </div>
    </div>
  );
};

export default IncidentReports;
