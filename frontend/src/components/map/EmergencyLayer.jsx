// components/map/EmergencyLayer.jsx — animated emergency vehicle dot along route
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function EmergencyLayer({ route, active }) {
  const map    = useMap();
  const dotRef = useRef(null);
  const raf    = useRef(null);
  const prog   = useRef(0);

  useEffect(() => {
    if (!active || !route?.coordinates?.length) {
      dotRef.current?.remove();
      dotRef.current = null;
      cancelAnimationFrame(raf.current);
      return;
    }

    const html = `<div style="width:20px;height:20px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 0 16px #ef4444,0 0 32px rgba(239,68,68,0.5);animation:em-pulse 0.8s ease-in-out infinite alternate;"></div>
    <style>@keyframes em-pulse{from{transform:scale(1)}to{transform:scale(1.4)}}</style>`;

    dotRef.current?.remove();
    dotRef.current = L.marker(route.coordinates[0], {
      icon: L.divIcon({ html, className: "", iconSize: [20, 20], iconAnchor: [10, 10] }),
      zIndexOffset: 9999,
    }).addTo(map);

    const coords = route.coordinates;
    const tick = () => {
      prog.current = (prog.current + 0.002) % 1;
      const idx = Math.floor(prog.current * (coords.length - 1));
      const next = Math.min(idx + 1, coords.length - 1);
      const t = (prog.current * (coords.length - 1)) - idx;
      const lat = coords[idx][0] + (coords[next][0] - coords[idx][0]) * t;
      const lng = coords[idx][1] + (coords[next][1] - coords[idx][1]) * t;
      dotRef.current?.setLatLng([lat, lng]);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      dotRef.current?.remove();
      dotRef.current = null;
    };
  }, [active, route, map]);

  return null;
}
