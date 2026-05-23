from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from datetime import datetime
import asyncio, uvicorn, logging, tempfile, os, random

from app.models.schema import HealthResponse, IncidentReport, APIResponse
from app.logger import setup_logger
from app.exceptions import global_exception_handler
from app.ai_engine import VehicleDetector, TrafficAnalyzer, PredictiveEngine
from app.signal_optimizer import AdaptiveSignalEngine
from app.emergency_router import EmergencyRouter
from app.database.database_manager import DatabaseManager
import app.state_store as store

logging.basicConfig(level=logging.INFO)
logger = setup_logger()

app = FastAPI(title="UrbanFlowAI", version="1.0.0")
app.add_exception_handler(Exception, global_exception_handler)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

vehicle_detector = VehicleDetector()
traffic_analyzer = TrafficAnalyzer()
predictive_engine = PredictiveEngine()
signal_engine = AdaptiveSignalEngine()
emergency_router = EmergencyRouter()
db_manager = DatabaseManager()


# ── WebSocket manager ──────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, msg: Dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ── Startup / Shutdown ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    logger.info("Starting UrbanFlowAI Backend...")
    try:
        await db_manager.connect()
    except Exception as e:
        logger.warning(f"Database unavailable, running in mock mode: {e}")
    asyncio.create_task(background_signal_tick())
    asyncio.create_task(background_broadcast())


@app.on_event("shutdown")
async def shutdown_event():
    await db_manager.disconnect()


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "UrbanFlowAI Backend Running", "status": "ACTIVE", "version": "1.0.0"}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"server": "healthy", "database": "connected" if db_manager._available else "mock",
            "ai_engine": "active", "traffic_system": "running", "timestamp": datetime.now().isoformat()}


# ── Video Upload & Analysis ────────────────────────────────────────────────────
@app.post("/api/traffic/upload-video")
async def upload_video(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        analysis = await vehicle_detector.process_video(tmp_path)
        os.remove(tmp_path)

        # ── Push results to every panel via state store ──
        store.update_from_analysis(analysis)

        # ── Persist to DB if available ──
        await db_manager.store_traffic_data({
            "junction_id": "J001",
            "total_vehicles": analysis.get("total_vehicles", 0),
            "density": analysis.get("traffic_density", 0),
            "congestion_score": analysis.get("total_vehicles", 0) / 10,
            "source": "YOLO_AI",
        })

        # ── Broadcast to WebSocket clients ──
        await manager.broadcast({"type": "ANALYSIS_COMPLETE", "data": store.traffic_state})

        return {"success": True, "analysis": analysis, "traffic_state": store.traffic_state,
                "timestamp": datetime.now().isoformat()}

    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Live Traffic ───────────────────────────────────────────────────────────────
@app.get("/api/traffic/live")
async def get_live_traffic():
    return {"success": True, "data": store.junction_state,
            "message": "Live traffic data", "timestamp": datetime.now().isoformat()}


@app.get("/api/traffic/live-data")
async def get_live_data():
    return {"success": True, "data": store.traffic_state}


@app.get("/api/traffic/latest-analysis")
async def get_latest_analysis():
    return {"success": True, "analysis": store.latest_analysis,
            "has_data": bool(store.latest_analysis)}


# ── Signals ────────────────────────────────────────────────────────────────────
@app.get("/api/signals/status")
async def get_signal_status():
    return {"success": True, "signals": store.signal_state}


@app.post("/api/signals/optimize")
async def optimize_signal(junction_id: str):
    try:
        traffic_data = await db_manager.get_junction_traffic(junction_id)
        optimized = signal_engine.optimize_timing(traffic_data)

        # Update signal in state store
        for sig in store.signal_state:
            if sig["junction_id"] == junction_id:
                phases = optimized.get("phases", [])
                if phases:
                    sig["green_time"] = phases[0].get("green_time", sig["green_time"])
                sig["status"] = "green"
                sig["time_remaining"] = sig["green_time"]
                break

        await manager.broadcast({"type": "SIGNAL_UPDATE", "junction_id": junction_id, "timing": optimized})
        return {"success": True, "junction_id": junction_id, "optimized_timing": optimized}
    except Exception as e:
        logger.error(f"Signal optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/signals/optimize-all")
async def optimize_all_signals():
    results = []
    for sig in store.signal_state:
        traffic_data = await db_manager.get_junction_traffic(sig["junction_id"])
        optimized = signal_engine.optimize_timing(traffic_data)
        phases = optimized.get("phases", [])
        if phases:
            sig["green_time"] = phases[0].get("green_time", sig["green_time"])
        sig["status"] = "green"
        results.append({"junction_id": sig["junction_id"], "optimized": True})
    await manager.broadcast({"type": "ALL_SIGNALS_OPTIMIZED"})
    return {"success": True, "results": results}


# ── Analytics ──────────────────────────────────────────────────────────────────
@app.get("/api/analytics/statistics")
async def statistics():
    stats = await db_manager.get_statistics()
    # Merge with live state_store values (more up-to-date)
    merged = {**stats,
              "total_vehicles": store.traffic_state["total_vehicles"] or stats["total_vehicles"],
              "average_density": store.traffic_state["average_density"] or stats["average_density"],
              "active_incidents": len([i for i in store.incidents if i["status"] == "active"]),
              "optimized_signals": store.traffic_state["optimized_signals"],
              "traffic_status": store.traffic_state["traffic_status"],
              "average_speed": store.traffic_state["average_speed"],
              "vehicle_breakdown": store.traffic_state["vehicle_breakdown"],
              "source": store.traffic_state["source"],
              "last_updated": store.traffic_state["last_updated"]}
    return {"success": True, "data": merged, "message": "Statistics fetched"}


@app.get("/api/analytics/heatmap")
async def get_heatmap():
    return {"success": True, "heatmap": store.heatmap}


@app.get("/api/analytics/predictions")
async def get_predictions():
    return {"success": True, "prediction": store.predictions}


@app.get("/api/analytics/junction-stats")
async def junction_stats():
    return {"success": True, "junctions": store.junction_state}


# ── Incidents ──────────────────────────────────────────────────────────────────
@app.get("/api/incidents")
async def get_incidents():
    return {"success": True, "incidents": store.incidents}


@app.post("/api/incidents/report")
async def report_incident(incident: IncidentReport):
    new_inc = {
        "id": int(datetime.now().timestamp()),
        "junction_id": getattr(incident, "junction_id", "J001"),
        "junction_name": getattr(incident, "junction_id", "Unknown"),
        "type": getattr(incident, "type", "accident"),
        "severity": getattr(incident, "severity", "medium"),
        "description": getattr(incident, "description", ""),
        "location": getattr(incident, "location", {}),
        "reported_at": datetime.now().isoformat(),
        "status": "active",
    }
    store.incidents.insert(0, new_inc)
    await manager.broadcast({"type": "incident_alert", "incident": new_inc})
    return {"success": True, "incident_id": new_inc["id"]}


@app.patch("/api/incidents/{incident_id}/status")
async def update_incident_status(incident_id: int, status: str):
    for inc in store.incidents:
        if inc["id"] == incident_id:
            inc["status"] = status
            return {"success": True}
    raise HTTPException(status_code=404, detail="Incident not found")


@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: int):
    store.incidents[:] = [i for i in store.incidents if i["id"] != incident_id]
    return {"success": True}


# ── Emergency ──────────────────────────────────────────────────────────────────
@app.get("/api/emergency/corridors")
async def get_corridors():
    return {"success": True, "corridors": store.corridors}


@app.post("/api/emergency/create-corridor")
async def create_corridor(data: dict):
    route = emergency_router.calculate_route(
        {"lat": data.get("startLat", 23.0225), "lng": data.get("startLng", 72.5714)},
        {"lat": data.get("destLat", 23.0505),  "lng": data.get("destLng", 72.6010)},
    )
    corridor_result = await emergency_router.create_green_corridor(route)
    corridor = {
        "corridor_id": corridor_result["corridor_id"],
        "vehicle_type": data.get("vehicleType", "ambulance"),
        "priority": data.get("priority", 1),
        "status": "ACTIVE",
        "startLat": data.get("startLat"), "startLng": data.get("startLng"),
        "destLat": data.get("destLat"),   "destLng": data.get("destLng"),
        "route": route,
        "eta": max(3, int(route.get("estimated_time_seconds", 300) / 60)),
        "signals_synced": len(route.get("signals_to_control", [])),
        "activated_at": datetime.now().isoformat(),
    }
    store.corridors.insert(0, corridor)
    await manager.broadcast({"type": "emergency_alert", "corridor": corridor})
    return {"success": True, "corridor": corridor}


@app.patch("/api/emergency/corridors/{corridor_id}/toggle")
async def toggle_corridor(corridor_id: str):
    for c in store.corridors:
        if c["corridor_id"] == corridor_id:
            c["status"] = "PAUSED" if c["status"] == "ACTIVE" else "ACTIVE"
            return {"success": True, "status": c["status"]}
    raise HTTPException(status_code=404, detail="Corridor not found")


@app.delete("/api/emergency/corridors/{corridor_id}")
async def delete_corridor(corridor_id: str):
    store.corridors[:] = [c for c in store.corridors if c["corridor_id"] != corridor_id]
    return {"success": True}


# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws/live-updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_json({
                "type": "LIVE_TRAFFIC",
                "traffic_state": store.traffic_state,
                "signals": store.signal_state,
                "timestamp": datetime.now().isoformat(),
            })
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── Background tasks ───────────────────────────────────────────────────────────
async def background_signal_tick():
    """Tick signal timers every second."""
    while True:
        for sig in store.signal_state:
            sig["time_remaining"] = max(0, sig["time_remaining"] - 1)
            if sig["time_remaining"] == 0:
                cycle = ["green", "yellow", "red"]
                idx = cycle.index(sig["status"]) if sig["status"] in cycle else 0
                sig["status"] = cycle[(idx + 1) % 3]
                sig["time_remaining"] = {"green": sig["green_time"], "yellow": sig["yellow_time"], "red": sig["red_time"]}.get(sig["status"], 30)
        await asyncio.sleep(1)


async def background_broadcast():
    """Broadcast live state every 5 seconds."""
    while True:
        try:
            await manager.broadcast({
                "type": "LIVE_TRAFFIC",
                "traffic_state": store.traffic_state,
                "signals": store.signal_state,
                "timestamp": datetime.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
        await asyncio.sleep(5)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
