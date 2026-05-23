"""
Shared in-memory state store.
All panels read from here; video upload writes to here.
"""
from datetime import datetime
import random

# ── Latest video analysis result ──────────────────────────────────────────────
latest_analysis: dict = {}

# ── Live traffic state (updated by video upload + background loop) ─────────────
traffic_state: dict = {
    "total_vehicles": 0,
    "average_density": 0.0,
    "active_incidents": 0,
    "optimized_signals": 0,
    "traffic_status": "NORMAL",
    "average_speed": 42,
    "vehicle_breakdown": {"cars": 0, "bikes": 0, "buses": 0, "trucks": 0},
    "last_updated": datetime.now().isoformat(),
    "source": "idle",
}

# ── Per-junction data ──────────────────────────────────────────────────────────
JUNCTIONS = [
    {"id": "J001", "name": "Vadodara Circle",   "lat": 22.3072, "lng": 73.1812, "zone": "Central"},
    {"id": "J002", "name": "Railway Junction",  "lat": 22.3217, "lng": 73.1851, "zone": "East"},
    {"id": "J003", "name": "University Road",   "lat": 22.2973, "lng": 73.1759, "zone": "South"},
    {"id": "J004", "name": "Akota Bridge",      "lat": 22.3310, "lng": 73.1923, "zone": "West"},
    {"id": "J005", "name": "Sayajigunj",        "lat": 22.3005, "lng": 73.1698, "zone": "Central"},
    {"id": "J006", "name": "Fatehgunj Cross",   "lat": 22.3142, "lng": 73.1780, "zone": "North"},
]

junction_state: list = [
    {**j, "vehicle_count": 0, "density": 0.0, "congestion_score": 0.0,
     "signal_status": "GREEN", "green_time": 30, "yellow_time": 5, "red_time": 30}
    for j in JUNCTIONS
]

# ── Signal state ───────────────────────────────────────────────────────────────
signal_state: list = [
    {
        "id": f"SIG_{j['id']}", "junction_id": j["id"], "name": j["name"],
        "status": random.choice(["green", "yellow", "red"]),
        "green_time": 30, "yellow_time": 5, "red_time": 30,
        "vehicle_count": 0, "density": 0,
        "current_phase": "North-South", "time_remaining": random.randint(5, 45),
    }
    for j in JUNCTIONS
]

# ── Incidents ──────────────────────────────────────────────────────────────────
incidents: list = []

# ── Emergency corridors ────────────────────────────────────────────────────────
corridors: list = []

# ── Heatmap ────────────────────────────────────────────────────────────────────
heatmap: list = [
    {"junction": j["name"], "lat": j["lat"], "lng": j["lng"], "density": 0, "intensity": 0.0}
    for j in JUNCTIONS
]

# ── Analytics predictions ──────────────────────────────────────────────────────
predictions: list = [
    {"time_slot": f"{6 + i * 2}:00", "predicted_density": random.randint(30, 90)}
    for i in range(8)
]


def update_from_analysis(analysis: dict):
    """Called after every video upload — propagates results to all panels."""
    global latest_analysis, traffic_state, junction_state, signal_state, heatmap, predictions

    latest_analysis = analysis
    total = analysis.get("total_vehicles", 0)
    breakdown = analysis.get("vehicle_breakdown", {})
    congestion = analysis.get("congestion_level", "LOW")

    density_map = {"LOW": 28.0, "MEDIUM": 58.0, "HIGH": 84.0}
    speed_map   = {"LOW": 52,   "MEDIUM": 36,   "HIGH": 22}
    density_val = density_map.get(congestion, 28.0)
    speed_val   = speed_map.get(congestion, 42)

    status_map = {"LOW": "NORMAL", "MEDIUM": "MODERATE", "HIGH": "CRITICAL"}

    # ── traffic_state ──
    traffic_state.update({
        "total_vehicles": total,
        "average_density": round(density_val, 1),
        "active_incidents": analysis.get("incidents_detected", 0),
        "optimized_signals": len(JUNCTIONS),
        "traffic_status": status_map.get(congestion, "NORMAL"),
        "average_speed": speed_val,
        "vehicle_breakdown": {
            "cars":   breakdown.get("cars",  breakdown.get("car",  int(total * 0.55))),
            "bikes":  breakdown.get("bikes", breakdown.get("motorcycle", int(total * 0.22))),
            "buses":  breakdown.get("buses", breakdown.get("bus",  int(total * 0.12))),
            "trucks": breakdown.get("trucks",breakdown.get("truck",int(total * 0.11))),
        },
        "last_updated": datetime.now().isoformat(),
        "source": "video_analysis",
    })

    # ── per-junction (distribute vehicles across junctions) ──
    weights = [0.25, 0.20, 0.18, 0.15, 0.12, 0.10]
    for i, j in enumerate(junction_state):
        jv = int(total * weights[i])
        jd = round(density_val * weights[i] * 4, 1)
        jd = min(jd, 99.0)
        j.update({
            "vehicle_count": jv,
            "density": jd,
            "congestion_score": round(jd / 10, 1),
            "signal_status": "RED" if jd > 70 else "YELLOW" if jd > 45 else "GREEN",
            "green_time": max(10, int(60 - jd * 0.4)),
            "red_time":   max(10, int(jd * 0.4)),
        })

    # ── signals ──
    for i, sig in enumerate(signal_state):
        j = junction_state[i]
        sig.update({
            "status": j["signal_status"].lower(),
            "vehicle_count": j["vehicle_count"],
            "density": j["density"],
            "green_time": j["green_time"],
            "red_time": j["red_time"],
            "time_remaining": random.randint(5, j["green_time"]),
        })

    # ── heatmap ──
    for i, h in enumerate(heatmap):
        j = junction_state[i]
        h.update({"density": j["density"], "intensity": round(j["density"] / 100, 2)})

    # ── predictions (shift based on current density) ──
    base = density_val
    for k, p in enumerate(predictions):
        p["predicted_density"] = min(99, max(10, int(base + random.randint(-15, 20) + k * 2)))

    # ── auto-generate incident if HIGH congestion ──
    if congestion == "HIGH" and not any(inc["status"] == "active" for inc in incidents):
        incidents.insert(0, {
            "id": int(datetime.now().timestamp()),
            "junction_id": "J001",
            "junction_name": "Vadodara Circle",
            "type": "congestion",
            "severity": "high",
            "description": f"AI detected high congestion — {total} vehicles, density {density_val}%",
            "location": {"lat": 23.0225, "lng": 72.5714},
            "reported_at": datetime.now().isoformat(),
            "status": "active",
        })
