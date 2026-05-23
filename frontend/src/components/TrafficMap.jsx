import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap, useMapEvents, ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "./TrafficMap.css";

import { useTrafficData }  from "../hooks/useTrafficData";
import { useSearch }       from "../hooks/useSearch";
import { useRoute }        from "../hooks/useRoute";

import SearchBar       from "./map/SearchBar";
import MapControls     from "./map/MapControls";
import RoutePanel      from "./map/RoutePanel";
import JunctionSidebar from "./map/JunctionSidebar";
import InfoPanel       from "./map/InfoPanel";
import FlowLayer       from "./map/FlowLayer";
import EmergencyLayer  from "./map/EmergencyLayer";

import {
  VADODARA, DEFAULT_ZOOM, TILE_LAYERS,
  ROAD_CONNECTIONS, densityColor, makePinIcon, makeLabelIcon,
} from "../map/mapUtils";

/* ── fix Leaflet default icon ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* ── inner component: handles map events & imperative view changes ── */
function MapController({ target, routeMode, onMapClick }) {
  const map = useMap();

  // fly to searched location
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom || 15, { duration: 1.4 });
  }, [target, map]);

  // click handler for route mode
  useMapEvents({
    click(e) {
      if (routeMode) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

/* ══════════════════════════════════════════════════════════════════════════════
   TrafficMap — main export
══════════════════════════════════════════════════════════════════════════════ */
export default function TrafficMap() {
  const { junctions, lastUpdate, loading, refresh } = useTrafficData();
  const search = useSearch();
  const routeHook = useRoute();

  const [selected,    setSelected]    = useState(null);
  const [mapType,     setMapType]     = useState("roadmap");
  const [trafficOn,   setTrafficOn]   = useState(true);
  const [routeMode,   setRouteMode]   = useState(false);
  const [emergency,   setEmergency]   = useState(false);
  const [flyTarget,   setFlyTarget]   = useState(null);
  const [searchMarker,setSearchMarker]= useState(null); // { lat, lng, name }
  const [liveLog,     setLiveLog]     = useState([]);
  const [pulseIdx,    setPulseIdx]    = useState(0);
  const [statsOpen,   setStatsOpen]   = useState(true);

  // pulse animation
  useEffect(() => {
    const iv = setInterval(() => setPulseIdx((p) => (p + 1) % 6), 2500);
    return () => clearInterval(iv);
  }, []);

  const addLog = useCallback((msg, type = "info") => {
    setLiveLog((p) => [
      { id: Date.now() + Math.random(), msg, type, time: new Date().toLocaleTimeString() },
      ...p.slice(0, 24),
    ]);
  }, []);

  /* ── search handler ── */
  const handleSearch = useCallback(async (queryOrSuggestion) => {
    const result = await search.searchPlace(queryOrSuggestion);
    if (!result) return;
    setSearchMarker({ lat: result.lat, lng: result.lng, name: result.displayName.split(",")[0] });
    setFlyTarget({ lat: result.lat, lng: result.lng, zoom: 15 });
    addLog(`🔍 Navigated to ${result.displayName.split(",")[0]}`, "info");
  }, [search, addLog]);

  /* ── route mode: collect two clicks ── */
  const routeClickCount = useRef(0);
  const handleMapClick = useCallback(async (latlng) => {
    if (!routeMode) return;
    routeClickCount.current += 1;

    if (routeClickCount.current === 1) {
      routeHook.setOrigin({ ...latlng, name: `Point A (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})` });
      addLog("📍 Origin set — click destination", "info");
    } else {
      const dest = { ...latlng, name: `Point B (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})` };
      routeHook.setDest(dest);
      setRouteMode(false);
      routeClickCount.current = 0;
      addLog("🗺 Calculating route…", "info");
      const r = await routeHook.buildRoute(routeHook.origin, dest);
      if (r) addLog(`✅ Route: ${r.distance} km · ${r.duration} min`, "info");
    }
  }, [routeMode, routeHook, addLog]);

  /* ── my location ── */
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) { addLog("⚠️ Geolocation not supported", "warn"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setFlyTarget({ lat, lng, zoom: 15 });
        setSearchMarker({ lat, lng, name: "My Location" });
        addLog("📍 Moved to your location", "info");
      },
      () => {
        // fallback to Vadodara
        setFlyTarget({ lat: VADODARA.lat, lng: VADODARA.lng, zoom: 14 });
        addLog("📍 Showing Vadodara (location denied)", "warn");
      }
    );
  }, [addLog]);

  /* ── derived stats ── */
  const totalVeh  = junctions.reduce((a, j) => a + (j.vehicle_count || 0), 0);
  const avgDen    = junctions.length
    ? Math.round(junctions.reduce((a, j) => a + (j.density || 0), 0) / junctions.length) : 0;
  const critCount = junctions.filter((j) => j.density > 70).length;

  const denCol = avgDen > 70 ? "#c0392b" : avgDen > 45 ? "#e67e22" : "#27ae60";

  return (
    <div className="tm-page">

      {/* ══════════════════════════════════════════════════════
          FULL-SCREEN MAP
      ══════════════════════════════════════════════════════ */}
      <div className={`tm-map-container ${routeMode ? "route-cursor" : ""}`}>
        <MapContainer
          center={[VADODARA.lat, VADODARA.lng]}
          zoom={DEFAULT_ZOOM}
          className="tm-leaflet"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer key={mapType} url={TILE_LAYERS[mapType]}
            attribution="&copy; OpenStreetMap &copy; CARTO" maxZoom={19} />

          <ZoomControl position="bottomright" />

          <MapController
            target={flyTarget}
            routeMode={routeMode}
            onMapClick={handleMapClick}
          />

          {/* animated flow dots */}
          {trafficOn && junctions.length > 1 && <FlowLayer junctions={junctions} />}

          {/* emergency vehicle animation */}
          <EmergencyLayer route={routeHook.route} active={emergency} />

          {/* traffic road overlays */}
          {trafficOn && ROAD_CONNECTIONS.map(([a, b], i) => {
            const A = junctions[a], B = junctions[b];
            if (!A || !B) return null;
            const avg = ((A.density || 0) + (B.density || 0)) / 2;
            const col = densityColor(avg);
            return (
              <React.Fragment key={i}>
                <Polyline positions={[[A.lat, A.lng], [B.lat, B.lng]]}
                  pathOptions={{ color: "rgba(0,0,0,0.2)", weight: avg > 60 ? 10 : 7, opacity: 1 }} />
                <Polyline positions={[[A.lat, A.lng], [B.lat, B.lng]]}
                  pathOptions={{ color: col, weight: avg > 60 ? 7 : 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
              </React.Fragment>
            );
          })}

          {/* route polyline */}
          {routeHook.route && (
            <Polyline
              positions={routeHook.route.coordinates}
              pathOptions={{ color: "#1a73e8", weight: 6, opacity: 0.9, lineCap: "round", lineJoin: "round",
                dashArray: emergency ? "12 8" : null }}
            />
          )}

          {/* junction markers */}
          {junctions.map((j, i) => (
            <Marker key={i} position={[j.lat, j.lng]}
              icon={makePinIcon(L, densityColor(j.density || 0), j.density > 60 || i === pulseIdx)}
              eventHandlers={{ click: () => { setSelected(j); addLog(`📍 ${j.name}`, "info"); } }}
            >
              <Popup className="tm-popup-wrap" closeButton={false}>
                <div className="tm-popup">
                  <div className="tm-popup-header" style={{ borderLeftColor: densityColor(j.density) }}>
                    <div className="tm-popup-name">{j.name}</div>
                    <div className="tm-popup-zone">{j.zone} Zone</div>
                  </div>
                  <div className="tm-popup-body">
                    <div className="tm-popup-bar-bg">
                      <div className="tm-popup-bar" style={{ width: `${j.density}%`, background: densityColor(j.density) }} />
                    </div>
                    <div className="tm-popup-row"><span>Density</span><span style={{ color: densityColor(j.density), fontWeight: 700 }}>{j.density}%</span></div>
                    <div className="tm-popup-row"><span>Vehicles</span><span style={{ fontWeight: 700 }}>{j.vehicle_count || 0}</span></div>
                    <div className="tm-popup-row"><span>Signal</span><span style={{ color: j.signal_status === "RED" ? "#e74c3c" : j.signal_status === "YELLOW" ? "#f39c12" : "#27ae60", fontWeight: 700 }}>{j.signal_status || "GREEN"}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* route origin / dest markers */}
          {routeHook.origin && (
            <Marker position={[routeHook.origin.lat, routeHook.origin.lng]}
              icon={makeLabelIcon(L, "A", "#27ae60")} />
          )}
          {routeHook.dest && (
            <Marker position={[routeHook.dest.lat, routeHook.dest.lng]}
              icon={makeLabelIcon(L, "B", "#e74c3c")} />
          )}

          {/* searched location marker */}
          {searchMarker && (
            <Marker position={[searchMarker.lat, searchMarker.lng]}
              icon={makePinIcon(L, "#1a73e8", true)}
            >
              <Popup className="tm-popup-wrap" closeButton={false}>
                <div className="tm-popup">
                  <div className="tm-popup-header" style={{ borderLeftColor: "#1a73e8" }}>
                    <div className="tm-popup-name">{searchMarker.name}</div>
                    <div className="tm-popup-zone">Searched Location</div>
                  </div>
                  <div className="tm-popup-body">
                    <div className="tm-popup-row"><span>Lat</span><span style={{ fontWeight: 700 }}>{searchMarker.lat.toFixed(5)}</span></div>
                    <div className="tm-popup-row"><span>Lng</span><span style={{ fontWeight: 700 }}>{searchMarker.lng.toFixed(5)}</span></div>
                    <div className="tm-popup-row">
                      <button className="tm-popup-route-btn"
                        onClick={() => { routeHook.setOrigin({ ...searchMarker }); setRouteMode(true); routeClickCount.current = 1; addLog("📍 Origin set — click destination on map", "info"); }}>
                        Route from here
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ── SEARCH BAR (top center) ── */}
        <div className="tm-searchbar-overlay">
          <SearchBar
            query={search.query}
            suggestions={search.suggestions}
            searching={search.searching}
            error={search.error}
            onQueryChange={search.onQueryChange}
            onSelect={handleSearch}
            onClear={() => { search.clear(); setSearchMarker(null); }}
            onSearch={handleSearch}
          />
        </div>

        {/* ── MAP CONTROLS (top right) ── */}
        <div className="tm-controls-overlay">
          <MapControls
            mapType={mapType}
            onMapType={setMapType}
            trafficOn={trafficOn}
            onTrafficToggle={() => setTrafficOn((v) => !v)}
            onMyLocation={handleMyLocation}
            onRefresh={() => { refresh(); addLog("🔄 Data refreshed", "info"); }}
            routeMode={routeMode}
            onRouteModeToggle={() => {
              setRouteMode((v) => !v);
              routeClickCount.current = 0;
              if (!routeMode) addLog("🗺 Route mode: click origin on map", "info");
            }}
            onClearRoute={() => { routeHook.clearRoute(); setEmergency(false); }}
            hasRoute={!!routeHook.route}
          />
        </div>

        {/* ── STATS BAR (top, below search) ── */}
        <div className="tm-stats-bar">
          <button className="tm-stats-toggle" onClick={() => setStatsOpen((v) => !v)}>
            {statsOpen ? "▲" : "▼"}
          </button>
          {statsOpen && (
            <>
              <div className="tm-stat-chip">
                <span className="tm-stat-icon">🚗</span>
                <div><div className="tm-stat-val">{totalVeh.toLocaleString()}</div><div className="tm-stat-lbl">Vehicles</div></div>
              </div>
              <div className="tm-stat-chip">
                <span className="tm-stat-icon">📊</span>
                <div><div className="tm-stat-val" style={{ color: denCol }}>{avgDen}%</div><div className="tm-stat-lbl">Avg Density</div></div>
              </div>
              <div className="tm-stat-chip">
                <span className="tm-stat-icon">⚠️</span>
                <div><div className="tm-stat-val" style={{ color: critCount > 0 ? "#c0392b" : "#27ae60" }}>{critCount}</div><div className="tm-stat-lbl">Critical</div></div>
              </div>
              {lastUpdate && (
                <div className="tm-stat-chip tm-stat-time">
                  <span className="tm-live-dot-sm" />
                  <span style={{ fontSize: 11, color: "#374151" }}>Updated {lastUpdate}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ROUTE MODE HINT ── */}
        {routeMode && (
          <div className="tm-route-hint">
            {!routeHook.origin
              ? "🖱 Click on the map to set origin (Point A)"
              : "🖱 Click on the map to set destination (Point B)"}
          </div>
        )}

        {/* ── ROUTE PANEL (bottom center) ── */}
        <div className="tm-route-panel-overlay">
          <RoutePanel
            route={routeHook.route}
            origin={routeHook.origin}
            dest={routeHook.dest}
            loading={routeHook.loading}
            error={routeHook.error}
            onClear={() => { routeHook.clearRoute(); setEmergency(false); }}
            emergency={emergency}
            onEmergency={() => setEmergency((v) => !v)}
          />
        </div>

        {/* ── JUNCTION INFO PANEL (bottom center, on junction click) ── */}
        <div className="tm-info-panel-overlay">
          <InfoPanel selected={selected} onClose={() => setSelected(null)} />
        </div>

        {/* ── LEFT SIDEBAR ── */}
        <div className="tm-sidebar-overlay">
          <JunctionSidebar
            junctions={junctions}
            selected={selected}
            onSelect={(j) => {
              setSelected(j);
              setFlyTarget({ lat: j.lat, lng: j.lng, zoom: 16 });
              addLog(`📍 ${j.name}`, "info");
            }}
            liveLog={liveLog}
            lastUpdate={lastUpdate}
          />
        </div>

        {/* ── LEGEND (bottom left) ── */}
        <div className="tm-legend">
          <div className="tm-legend-title">Traffic</div>
          {[
            { color: "#27ae60", label: "No traffic" },
            { color: "#f1c40f", label: "Moderate" },
            { color: "#e67e22", label: "Heavy" },
            { color: "#c0392b", label: "Very heavy" },
          ].map((l, i) => (
            <div key={i} className="tm-legend-row">
              <span className="tm-legend-line" style={{ background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>

        {/* loading overlay */}
        {loading && (
          <div className="tm-loading-overlay">
            <div className="tm-loading-spinner" />
            <span>Loading traffic data…</span>
          </div>
        )}
      </div>
    </div>
  );
}
