// hooks/useTrafficData.js
import { useState, useEffect, useCallback, useRef } from "react";
import { analyticsAPI } from "../services/api";
import { VADODARA_JUNCTIONS } from "../map/mapUtils";

export function useTrafficData() {
  const [junctions,   setJunctions]   = useState([]);
  const [trafficState,setTrafficState]= useState(null);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const wsRef = useRef(null);

  const fetch = useCallback(async () => {
    try {
      const [h, j] = await Promise.all([
        analyticsAPI.getHeatmap(),
        analyticsAPI.getJunctions(),
      ]);
      const merged = (j.success ? j.junctions : VADODARA_JUNCTIONS).map((junc, i) => {
        const hm = (h.success ? h.heatmap : []).find((x) => x.junction === junc.name);
        const base = VADODARA_JUNCTIONS[i] || junc;
        return { ...junc, lat: base.lat, lng: base.lng, density: hm?.density ?? junc.density ?? 0 };
      });
      setJunctions(merged);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      // fallback to static junctions with zero density
      setJunctions(VADODARA_JUNCTIONS.map((j) => ({ ...j, density: 0, vehicle_count: 0 })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const poll = setInterval(fetch, 4000);

    try {
      wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws/live-updates");
      wsRef.current.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "ANALYSIS_COMPLETE" || d.type === "LIVE_TRAFFIC") {
            fetch();
            if (d.traffic_state) setTrafficState(d.traffic_state);
          }
        } catch {}
      };
    } catch {}

    return () => {
      clearInterval(poll);
      wsRef.current?.close();
    };
  }, [fetch]);

  return { junctions, trafficState, lastUpdate, loading, refresh: fetch };
}
