// components/map/RoutePanel.jsx
import React from "react";
import { densityColor } from "../../map/mapUtils";

export default function RoutePanel({ route, origin, dest, loading, error, onClear, emergency, onEmergency }) {
  if (loading) return (
    <div className="rp-wrap">
      <div className="rp-loading">
        <div className="rp-spinner" />
        <span>Calculating route…</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="rp-wrap rp-error">
      <span>⚠️ {error}</span>
      <button className="rp-close" onClick={onClear}>✕</button>
    </div>
  );

  if (!route) return null;

  return (
    <div className="rp-wrap">
      <div className="rp-header">
        <div className="rp-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1a73e8" strokeWidth="2.5">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
          Route Details
        </div>
        <button className="rp-close" onClick={onClear}>✕</button>
      </div>

      <div className="rp-points">
        <div className="rp-point">
          <span className="rp-dot rp-dot-green" />
          <span className="rp-point-name">{origin?.name || "Origin"}</span>
        </div>
        <div className="rp-line" />
        <div className="rp-point">
          <span className="rp-dot rp-dot-red" />
          <span className="rp-point-name">{dest?.name || "Destination"}</span>
        </div>
      </div>

      <div className="rp-stats">
        <div className="rp-stat">
          <span className="rp-stat-val">{route.distance} km</span>
          <span className="rp-stat-lbl">Distance</span>
        </div>
        <div className="rp-divider" />
        <div className="rp-stat">
          <span className="rp-stat-val">{route.duration} min</span>
          <span className="rp-stat-lbl">Est. Time</span>
        </div>
        <div className="rp-divider" />
        <div className="rp-stat">
          <span className="rp-stat-val" style={{ color: densityColor(50) }}>MODERATE</span>
          <span className="rp-stat-lbl">Traffic</span>
        </div>
      </div>

      <button
        className={`rp-emergency-btn ${emergency ? "active" : ""}`}
        onClick={onEmergency}
      >
        {emergency ? "🚨 Emergency Active" : "🚑 Simulate Emergency"}
      </button>
    </div>
  );
}
