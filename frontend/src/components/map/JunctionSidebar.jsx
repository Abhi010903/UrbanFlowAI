// components/map/JunctionSidebar.jsx
import React from "react";
import { densityColor, densityLabel, signalColor } from "../../map/mapUtils";

export default function JunctionSidebar({ junctions, selected, onSelect, liveLog, lastUpdate }) {
  return (
    <div className="js-wrap">
      <div className="js-head">
        <span className="js-title">Live Junctions</span>
        <div className="js-live">
          <span className="js-live-dot" />
          {lastUpdate || "—"}
        </div>
      </div>

      <div className="js-list">
        {junctions.map((j, i) => {
          const col = densityColor(j.density || 0);
          const sc  = signalColor(j.signal_status);
          return (
            <div
              key={i}
              className={`js-item ${selected?.name === j.name ? "active" : ""}`}
              onClick={() => onSelect(j)}
            >
              <span className="js-dot" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              <div className="js-info">
                <span className="js-name">{j.name}</span>
                <span className="js-meta">{j.vehicle_count || 0} vehicles · {j.zone}</span>
              </div>
              <div className="js-right">
                <span className="js-pct" style={{ color: col }}>{j.density || 0}%</span>
                <span className="js-sig" style={{ background: sc }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* live feed */}
      <div className="js-feed">
        <div className="js-feed-head">Live Feed</div>
        <div className="js-feed-list">
          {liveLog.length > 0 ? liveLog.slice(0, 6).map((l) => (
            <div key={l.id} className={`js-feed-item js-feed-${l.type}`}>
              <span className="js-feed-msg">{l.msg}</span>
              <span className="js-feed-time">{l.time}</span>
            </div>
          )) : <p className="js-feed-empty">Waiting for data…</p>}
        </div>
      </div>
    </div>
  );
}
