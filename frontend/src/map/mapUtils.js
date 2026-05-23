// map/mapUtils.js — pure utility functions, no React

export const VADODARA = { lat: 22.3072, lng: 73.1812 };
export const DEFAULT_ZOOM = 14;

/** Traffic density → color (Google Maps style) */
export function densityColor(d) {
  if (d > 80) return "#c0392b";
  if (d > 60) return "#e67e22";
  if (d > 40) return "#f1c40f";
  return "#27ae60";
}

export function densityLabel(d) {
  if (d > 80) return "CRITICAL";
  if (d > 60) return "HIGH";
  if (d > 40) return "MODERATE";
  return "LOW";
}

export function signalColor(s) {
  return { GREEN: "#27ae60", YELLOW: "#f39c12", RED: "#e74c3c" }[s?.toUpperCase()] || "#27ae60";
}

/** Nominatim geocode — search any place, returns { lat, lng, displayName } */
export async function geocodePlace(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) throw new Error("Location not found");
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
    type: data[0].type,
    address: data[0].address,
  };
}

/** Nominatim autocomplete — returns array of suggestions */
export async function autocompletePlaces(query) {
  if (!query || query.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name,
    shortName: d.name || d.display_name.split(",")[0],
    type: d.type,
    address: d.address,
  }));
}

/** OSRM routing — returns { coordinates, distance, duration } */
export async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found");
  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: (route.distance / 1000).toFixed(1),
    duration: Math.round(route.duration / 60),
    steps: route.legs[0]?.steps || [],
  };
}

/** Haversine distance in km */
export function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Calculate traffic level at any searched location.
 * Finds nearest junction, weights density by distance.
 * Returns { density, level, label, color, bg, border, nearestJunction, distance }
 */
export function getTrafficAtLocation(lat, lng, junctions) {
  if (!junctions || junctions.length === 0) {
    return {
      density: 0, level: "NO_TRAFFIC", label: "No Traffic",
      color: "#16a34a", bg: "#dcfce7", border: "#16a34a",
      nearestJunction: null, distance: null,
    };
  }

  // Find nearest junction
  let nearest = null;
  let minDist = Infinity;
  for (const j of junctions) {
    const d = haversine({ lat, lng }, { lat: j.lat, lng: j.lng });
    if (d < minDist) { minDist = d; nearest = j; }
  }

  // Weight density by distance — beyond 3 km = no influence
  const distanceFactor = Math.max(0, 1 - minDist / 3);
  const density = Math.round((nearest?.density || 0) * distanceFactor);

  if (density > 60) return {
    density, level: "HEAVY", label: "Heavy Traffic",
    color: "#dc2626", bg: "#fee2e2", border: "#dc2626",
    nearestJunction: nearest, distance: minDist.toFixed(1),
  };
  if (density > 30) return {
    density, level: "MODERATE", label: "Moderate Traffic",
    color: "#d97706", bg: "#fef3c7", border: "#d97706",
    nearestJunction: nearest, distance: minDist.toFixed(1),
  };
  return {
    density, level: "NO_TRAFFIC", label: "No Traffic",
    color: "#16a34a", bg: "#dcfce7", border: "#16a34a",
    nearestJunction: nearest, distance: minDist.toFixed(1),
  };
}

/** Build traffic-level colored pulsing pin */
export function makeTrafficPin(L, trafficInfo, pulse = true) {
  const color = trafficInfo?.color || "#1a73e8";
  const ring = pulse
    ? `<circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.5">
        <animate attributeName="r" values="14;28;14" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const html = `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    ${ring}
    <circle cx="22" cy="22" r="16" fill="white" opacity="0.95"/>
    <circle cx="22" cy="22" r="12" fill="${color}"/>
    <circle cx="22" cy="22" r="5"  fill="white"/>
  </svg>`;
  return L.divIcon({ html, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
}

/** Build SVG pin icon for Leaflet */
export function makePinIcon(L, color, pulse = false) {
  const ring = pulse
    ? `<circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.4">
        <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const html = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    ${ring}
    <circle cx="20" cy="20" r="14" fill="white" opacity="0.9"/>
    <circle cx="20" cy="20" r="10" fill="${color}"/>
    <circle cx="20" cy="20" r="4" fill="white"/>
  </svg>`;
  return L.divIcon({ html, className: "", iconSize: [40, 40], iconAnchor: [20, 20] });
}

/** Build numbered label icon */
export function makeLabelIcon(L, label, color) {
  const html = `<div style="background:${color};color:#fff;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${label}</div>`;
  return L.divIcon({ html, className: "", iconAnchor: [0, 0] });
}

export const TILE_LAYERS = {
  roadmap:   "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain:   "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  night:     "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

export const VADODARA_JUNCTIONS = [
  { id: "J001", name: "Vadodara Circle",  lat: 22.3072, lng: 73.1812, zone: "Central" },
  { id: "J002", name: "Railway Junction", lat: 22.3217, lng: 73.1851, zone: "East"    },
  { id: "J003", name: "University Road",  lat: 22.2973, lng: 73.1759, zone: "South"   },
  { id: "J004", name: "Akota Bridge",     lat: 22.3310, lng: 73.1923, zone: "West"    },
  { id: "J005", name: "Sayajigunj",       lat: 22.3005, lng: 73.1698, zone: "Central" },
  { id: "J006", name: "Fatehgunj Cross",  lat: 22.3142, lng: 73.1780, zone: "North"   },
];

export const ROAD_CONNECTIONS = [[0,1],[0,4],[1,2],[1,5],[2,3],[3,4],[4,5],[2,5]];
