// components/map/FlowLayer.jsx  — animated vehicle dots along roads
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { ROAD_CONNECTIONS, densityColor } from "../../map/mapUtils";

export default function FlowLayer({ junctions }) {
  const map  = useMap();
  const dots = useRef([]);
  const raf  = useRef(null);
  const prog = useRef(ROAD_CONNECTIONS.map(() => Math.random()));

  useEffect(() => {
    if (junctions.length < 2) return;

    dots.current.forEach((d) => d.remove());
    dots.current = ROAD_CONNECTIONS.map(() =>
      L.circleMarker([0, 0], { radius: 5, weight: 0, fillColor: "#4285F4", fillOpacity: 0.9 }).addTo(map)
    );

    const tick = () => {
      ROAD_CONNECTIONS.forEach(([a, b], i) => {
        const A = junctions[a], B = junctions[b];
        if (!A || !B) return;
        prog.current[i] = (prog.current[i] + 0.003) % 1;
        const t = prog.current[i];
        dots.current[i]?.setLatLng([A.lat + (B.lat - A.lat) * t, A.lng + (B.lng - A.lng) * t]);
        dots.current[i]?.setStyle({ fillColor: densityColor(((A.density || 0) + (B.density || 0)) / 2) });
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      dots.current.forEach((d) => d.remove());
      dots.current = [];
    };
  }, [junctions, map]);

  return null;
}
