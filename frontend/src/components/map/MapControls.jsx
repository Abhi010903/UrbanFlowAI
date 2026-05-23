// components/map/MapControls.jsx
import React from "react";

export default function MapControls({
  mapType, onMapType,
  trafficOn, onTrafficToggle,
  onMyLocation,
  onRefresh,
  routeMode, onRouteModeToggle,
  onClearRoute,
  hasRoute,
}) {
  const types = [
    { key: "roadmap",   icon: "🗺",  label: "Map"       },
    { key: "satellite", icon: "🛰",  label: "Satellite" },
    { key: "terrain",   icon: "⛰",  label: "Terrain"   },
    { key: "night",     icon: "🌙",  label: "Night"     },
  ];

  return (
    <div className="mc-wrap">
      {/* map type */}
      <div className="mc-group">
        {types.map((t) => (
          <button
            key={t.key}
            className={`mc-type-btn ${mapType === t.key ? "active" : ""}`}
            onClick={() => onMapType(t.key)}
            title={t.label}
          >
            <span>{t.icon}</span>
            <span className="mc-type-lbl">{t.label}</span>
          </button>
        ))}
      </div>

      {/* action buttons */}
      <div className="mc-actions">
        <button
          className={`mc-action-btn ${trafficOn ? "active-green" : ""}`}
          onClick={onTrafficToggle}
          title="Toggle traffic layer"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          Traffic {trafficOn ? "ON" : "OFF"}
        </button>

        <button
          className={`mc-action-btn ${routeMode ? "active-blue" : ""}`}
          onClick={onRouteModeToggle}
          title="Route mode: click two points on map"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
          {routeMode ? "Cancel Route" : "Get Route"}
        </button>

        {hasRoute && (
          <button className="mc-action-btn active-red" onClick={onClearRoute} title="Clear route">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
            Clear Route
          </button>
        )}

        <button className="mc-action-btn" onClick={onMyLocation} title="My location">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" strokeDasharray="2 2"/>
          </svg>
          My Location
        </button>

        <button className="mc-action-btn" onClick={onRefresh} title="Refresh data">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}
