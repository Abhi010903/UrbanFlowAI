import React, { useState, useEffect } from "react";
import { FiCheck, FiTrash2, FiPlus, FiRefreshCw } from "react-icons/fi";
import "./IncidentReports.css";
import { incidentsAPI } from "../services/api";

const TYPE_ICONS = { accident:"🚗💥", congestion:"🚦", roadwork:"🚧", breakdown:"🔧", weather:"🌧️" };
const SEV_COLOR  = { high:"#ef4444", medium:"#f59e0b", low:"#10b981", critical:"#dc2626" };

export default function IncidentReports() {
  const [incidents,  setIncidents]  = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [loading,    setLoading]    = useState(false);
  const [form, setForm] = useState({ junctionId:"", type:"accident", severity:"medium", description:"", location:"" });

  const fetchIncidents = async () => {
    try { const r = await incidentsAPI.getAll(); if (r.success) setIncidents(r.incidents); } catch {}
  };

  useEffect(() => { fetchIncidents(); const iv = setInterval(fetchIncidents, 5000); return () => clearInterval(iv); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await incidentsAPI.report({
        junction_id: form.junctionId, type: form.type,
        severity: form.severity, description: form.description,
        location: form.location,
      });
      setForm({ junctionId:"", type:"accident", severity:"medium", description:"", location:"" });
      setShowForm(false);
      fetchIncidents();
    } catch {} finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try { await incidentsAPI.updateStatus(id, status); fetchIncidents(); } catch {}
  };

  const deleteInc = async (id) => {
    try { await incidentsAPI.delete(id); fetchIncidents(); } catch {}
  };

  const filtered = filter === "all" ? incidents : incidents.filter(i => i.status === filter);
  const counts = {
    all: incidents.length,
    active: incidents.filter(i => i.status === "active").length,
    resolving: incidents.filter(i => i.status === "resolving").length,
    resolved: incidents.filter(i => i.status === "resolved").length,
  };

  const timeSince = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    return m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ${m%60}m ago`;
  };

  return (
    <div className="ir-page">
      <div className="ir-header">
        <div>
          <h1 className="page-title">Incident Reports</h1>
          <p className="page-sub">Live incident tracking — auto-detected from video analysis</p>
        </div>
        <div className="ir-header-actions">
          <button className="btn-refresh" onClick={fetchIncidents}><FiRefreshCw size={14}/></button>
          <button className="btn-new-incident" onClick={() => setShowForm(!showForm)}><FiPlus size={16}/> New Report</button>
        </div>
      </div>

      <div className="ir-stats-row">
        {[
          { label:"Total",    value: counts.all,       color:"#3b82f6" },
          { label:"Active",   value: counts.active,    color:"#ef4444" },
          { label:"Resolving",value: counts.resolving, color:"#f59e0b" },
          { label:"Resolved", value: counts.resolved,  color:"#10b981" },
        ].map((s,i) => (
          <div key={i} className="ir-stat" style={{borderTopColor:s.color}}>
            <div className="ir-stat-val" style={{color:s.color}}>{s.value}</div>
            <div className="ir-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="ir-form-card">
          <h3>Report New Incident</h3>
          <form onSubmit={handleSubmit} className="ir-form">
            <div className="form-row-2">
              <div className="form-group"><label className="form-label">Junction ID</label><input className="form-input" type="text" placeholder="e.g., J001" value={form.junctionId} onChange={e=>setForm(p=>({...p,junctionId:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" type="text" placeholder="23.0225, 72.5714" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  <option value="accident">Accident</option>
                  <option value="congestion">Congestion</option>
                  <option value="roadwork">Road Work</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="weather">Weather</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-select" value={form.severity} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows="3" placeholder="Describe the incident..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required /></div>
            <div className="form-actions">
              <button type="submit" className="btn-submit-report" disabled={loading}>{loading?"Submitting...":"Submit Report"}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-tabs">
        {["all","active","resolving","resolved"].map(f => (
          <button key={f} className={`filter-tab ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]??0})
          </button>
        ))}
      </div>

      <div className="incidents-list">
        {filtered.length > 0 ? filtered.map(inc => (
          <div key={inc.id} className={`incident-card sev-${inc.severity}`}>
            <div className="inc-header">
              <div className="inc-title">
                <span className="inc-type-icon">{TYPE_ICONS[inc.type] || "⚠️"}</span>
                <div>
                  <h3 className="inc-junction">{inc.junction_name || inc.junction_id}</h3>
                  <span className="inc-type">{inc.type?.toUpperCase()} · #{inc.id}</span>
                </div>
              </div>
              <div className="inc-badges">
                <span className="sev-badge" style={{color:SEV_COLOR[inc.severity],borderColor:SEV_COLOR[inc.severity],background:`${SEV_COLOR[inc.severity]}18`}}>{inc.severity?.toUpperCase()}</span>
                <span className={`status-badge status-${inc.status}`}>{inc.status?.toUpperCase()}</span>
              </div>
            </div>

            <p className="inc-desc">{inc.description}</p>

            <div className="inc-footer">
              <span className="inc-loc">📍 {typeof inc.location === "object" ? `${inc.location?.lat?.toFixed(4)}, ${inc.location?.lng?.toFixed(4)}` : inc.location}</span>
              <span className="inc-time">{timeSince(inc.reported_at)}</span>
            </div>

            <div className="inc-actions">
              {inc.status === "active" && (
                <button className="btn-action-inc resolving" onClick={() => updateStatus(inc.id, "resolving")}>Mark Resolving</button>
              )}
              {inc.status === "resolving" && (
                <button className="btn-action-inc resolve" onClick={() => updateStatus(inc.id, "resolved")}>
                  <FiCheck size={13}/> Mark Resolved
                </button>
              )}
              <button className="btn-delete" onClick={() => deleteInc(inc.id)}><FiTrash2 size={13}/> Delete</button>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            {filter === "all" ? "No incidents — they auto-appear after video analysis detects congestion" : `No ${filter} incidents`}
          </div>
        )}
      </div>
    </div>
  );
}
