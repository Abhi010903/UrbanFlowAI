import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./TrafficMap.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const createCustomIcon = (congestionLevel) => {
  const color =
    congestionLevel > 70
      ? "#ef4444"
      : congestionLevel > 50
      ? "#f59e0b"
      : "#10b981";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div 
        style="
          background-color:${color};
          width:30px;
          height:30px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "
      ></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const TrafficMap = () => {
  const [junctions, setJunctions] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedJunction, setSelectedJunction] = useState(null);

  const mapCenter = [23.0225, 72.5714];

  useEffect(() => {
    fetchMapData();

    const interval = setInterval(() => {
      fetchMapData();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchMapData = async () => {
    try {
      const trafficResponse = await fetch(
        "http://localhost:8000/api/traffic/live-data"
      );

      const trafficData = await trafficResponse.json();

      if (trafficData.status === "success") {
        const formattedJunctions = trafficData.data.map((j) => ({
          id: j.id,
          name: j.name,
          position: [j.latitude, j.longitude],
          vehicleCount: j.vehicle_count || 0,
          density: j.density_percentage || j.density || 0,
          congestion: j.congestion_score || 0
        }));

        setJunctions(formattedJunctions);
      }

      const heatmapResponse = await fetch(
        "http://localhost:8000/api/analytics/heatmap"
      );

      const heatmapJson = await heatmapResponse.json();

      if (heatmapJson.status === "success") {
        setHeatmapData(heatmapJson.heatmap || []);
      }
    } catch (error) {
      console.error("Traffic map fetch error:", error);
    }
  };

  const getCircleColor = (intensity) => {
    if (intensity > 0.7) return "#ef4444";
    if (intensity > 0.5) return "#f59e0b";
    return "#10b981";
  };

  const handleJunctionClick = (junction) => {
    setSelectedJunction(junction);
  };

  const handleOptimizeSignal = async (junctionId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/signals/optimize?junction_id=${junctionId}`,
        {
          method: "POST"
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        fetchMapData();
      }
    } catch (error) {
      console.error("Signal optimization error:", error);
    }
  };

  return (
    <div className="traffic-map-container">
      <div className="map-header">
        <h2>Real-Time Traffic Map</h2>

        <div className="map-controls">
          <button
            className={`control-btn ${showHeatmap ? "active" : ""}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            {showHeatmap ? "🔥 Hide Heatmap" : "🔥 Show Heatmap"}
          </button>

          <button className="control-btn" onClick={fetchMapData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#10b981" }}
          ></div>
          <span>Low Congestion (&lt;50%)</span>
        </div>

        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#f59e0b" }}
          ></div>
          <span>Medium Congestion (50-70%)</span>
        </div>

        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#ef4444" }}
          ></div>
          <span>High Congestion (&gt;70%)</span>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "600px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {junctions.map((junction) => (
            <Marker
              key={junction.id}
              position={junction.position}
              icon={createCustomIcon(junction.density)}
              eventHandlers={{
                click: () => handleJunctionClick(junction)
              }}
            >
              <Popup>
                <div className="junction-popup">
                  <h3>{junction.name}</h3>

                  <div className="popup-stats">
                    <p>
                      <strong>Junction ID:</strong> {junction.id}
                    </p>

                    <p>
                      <strong>Vehicles:</strong> {junction.vehicleCount}
                    </p>

                    <p>
                      <strong>Density:</strong>{" "}
                      {junction.density.toFixed(1)}%
                    </p>

                    <p>
                      <strong>Congestion:</strong>{" "}
                      {junction.congestion.toFixed(1)}/100
                    </p>
                  </div>

                  <div className="density-bar">
                    <div
                      className="density-fill"
                      style={{
                        width: `${junction.density}%`,
                        backgroundColor:
                          junction.density > 70
                            ? "#ef4444"
                            : junction.density > 50
                            ? "#f59e0b"
                            : "#10b981"
                      }}
                    ></div>
                  </div>

                  <button
                    className="optimize-btn"
                    onClick={() => handleOptimizeSignal(junction.id)}
                  >
                    Optimize Signal
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {showHeatmap &&
            heatmapData.map((point, index) => (
              <Circle
                key={index}
                center={[point.lat, point.lng]}
                radius={200}
                pathOptions={{
                  fillColor: getCircleColor(point.intensity),
                  fillOpacity: point.intensity * 0.4,
                  color: getCircleColor(point.intensity),
                  weight: 2,
                  opacity: 0.6
                }}
              />
            ))}
        </MapContainer>
      </div>

      {selectedJunction && (
        <div className="junction-details-panel">
          <button
            className="map-close-btn"
            onClick={() => setSelectedJunction(null)}
          >
            ×
          </button>

          <h3>{selectedJunction.name}</h3>

          <div className="map-detail-grid">
            <div className="map-detail-item">
              <span className="map-detail-label">Junction ID</span>
              <span className="map-detail-value">
                {selectedJunction.id}
              </span>
            </div>

            <div className="map-detail-item">
              <span className="map-detail-label">Vehicle Count</span>
              <span className="map-detail-value">
                {selectedJunction.vehicleCount}
              </span>
            </div>

            <div className="map-detail-item">
              <span className="map-detail-label">Traffic Density</span>
              <span className="map-detail-value">
                {selectedJunction.density.toFixed(1)}%
              </span>
            </div>

            <div className="map-detail-item">
              <span className="map-detail-label">Congestion Score</span>
              <span className="map-detail-value">
                {selectedJunction.congestion.toFixed(1)}/100
              </span>
            </div>
          </div>

          <div className="signal-status">
            <h4>Current Signal Status</h4>

            <div className="signal-phases">
              <div className="phase active">
                <div className="phase-light green"></div>
                <span>North-South: 45s</span>
              </div>

              <div className="phase">
                <div className="phase-light red"></div>
                <span>East-West: Wait</span>
              </div>
            </div>
          </div>

          <button
            className="action-btn primary"
            onClick={() => handleOptimizeSignal(selectedJunction.id)}
          >
            Optimize This Signal
          </button>
        </div>
      )}
    </div>
  );
};

export default TrafficMap;