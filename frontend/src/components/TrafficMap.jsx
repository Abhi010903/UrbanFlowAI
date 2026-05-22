import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "./TrafficMap.css";
import { analyticsAPI } from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const densityColor = (d) => {
  if (d > 80) return "#ef4444";
  if (d > 60) return "#f59e0b";
  if (d > 40) return "#06b6d4";
  return "#10b981";
};

const LEGEND = [
  { color: "#10b981", label: "0–40% Low" },
  { color: "#06b6d4", label: "40–60% Moderate" },
  { color: "#f59e0b", label: "60–80% High" },
  { color: "#ef4444", label: "80–100% Critical" },
];

const TrafficMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  const fetchData = async () => {
    try {
      const r = await analyticsAPI.getHeatmap();
      if (r.heatmap) setHeatmapData(r.heatmap);
    } catch {}
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h1 className="page-title">Traffic Map</h1>
          <p className="page-sub">Real-time traffic density visualization across junctions</p>
        </div>
        <button className="btn-refresh" onClick={fetchData}>↻ Refresh</button>
      </div>

      <div className="map-layout">
        <div className="map-wrap">
          <MapContainer center={[19.076, 72.8777]} zoom={12} className="leaflet-map">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {heatmapData.map((j, i) => (
              <CircleMarker
                key={i}
                center={[j.lat, j.lng]}
                radius={Math.min((j.density || 30) / 4, 28)}
                fillColor={densityColor(j.density || 0)}
                color={densityColor(j.density || 0)}
                weight={2} opacity={0.9} fillOpacity={0.55}
                eventHandlers={{ click: () => setSelected(j) }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{j.junction || "Junction"}</strong>
                    <p>Density: <span style={{ color: densityColor(j.density) }}>{j.density}%</span></p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="map-legend">
            <p className="legend-title">Traffic Density</p>
            {LEGEND.map((l, i) => (
              <div key={i} className="legend-row">
                <span className="legend-dot" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="junction-panel">
            <div className="jp-header">
              <h3>{selected.junction || "Junction"}</h3>
              <button className="jp-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="jp-stats">
              {[
                { label: "Density", value: `${selected.density || 0}%`, color: densityColor(selected.density) },
                { label: "Latitude", value: selected.lat?.toFixed(4), color: "#3b82f6" },
                { label: "Longitude", value: selected.lng?.toFixed(4), color: "#8b5cf6" },
              ].map((s, i) => (
                <div key={i} className="jp-stat">
                  <span className="jp-lbl">{s.label}</span>
                  <span className="jp-val" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="density-bar-wrap">
              <div className="density-bar-track">
                <div className="density-bar-fill" style={{ width: `${selected.density || 0}%`, background: densityColor(selected.density) }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficMap;
