// components/map/InfoPanel.jsx
import React from "react";
import { densityColor, densityLabel, signalColor } from "../../map/mapUtils";

export default function InfoPanel({ selected, onClose }) {
  if (!selected) return null;
  const col = densityColor(selected.density || 0);
  const sc  = signalColor(selected.signal_status);

  return (
    <div className="ip-wrap">
      <div className="ip-header">
        <div className="ip-pin" style={{ background: col }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div className="ip-title-block">
          <h3 className="ip-name">{selected.name}</h3>
          <p className="ip-zone">{selected.zone} Zone · {selected.id}</p>
        </div>
        <button className="ip-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="ip-density-bar">
        <div className="ip-density-track">
          <div className="ip-density-fill"
            style={{ width: `${selected.density || 0}%`, background: `linear-gradient(90deg,#27ae60,${col})` }} />
        </div>
        <div className="ip-density-labels">
          <span>0%</span>
          <span style={{ color: col, fontWeight: 700 }}>
            {selected.density || 0}% — {densityLabel(selected.density || 0)}
          </span>
          <span>100%</span>
        </div>
      </div>

      <div className="ip-grid">
        {[
          { icon: "🚗", label: "Vehicles",   value: selected.vehicle_count || 0 },
          { icon: "🚦", label: "Signal",     value: selected.signal_status || "GREEN", color: sc },
          { icon: "🟢", label: "Green Time", value: `${selected.green_time || 30}s` },
          { icon: "🔴", label: "Red Time",   value: `${selected.red_time || 30}s` },
          { icon: "📈", label: "Congestion", value: `${selected.congestion_score || 0}/10` },
          { icon: "📍", label: "Coords",     value: `${selected.lat?.toFixed(4)}, ${selected.lng?.toFixed(4)}` },
        ].map((s) => (
          <div key={s.label} className="ip-item">
            <span className="ip-item-icon">{s.icon}</span>
            <div>
              <div className="ip-item-lbl">{s.label}</div>
              <div className="ip-item-val" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
