from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    UploadFile,
    File,
    HTTPException
)

from fastapi.middleware.cors import CORSMiddleware

from typing import List, Dict

from datetime import datetime

import asyncio
import uvicorn
import logging
import tempfile
import os
from app.models.schema import (
    HealthResponse,
    IncidentReport,
    APIResponse
)
from app.logger import setup_logger
from app.exceptions import global_exception_handler

from app.ai_engine import (
    VehicleDetector,
    TrafficAnalyzer,
    PredictiveEngine
)

from app.signal_optimizer import (
    AdaptiveSignalEngine
)

from app.emergency_router import (
    EmergencyRouter
)

from app.database.database_manager import (
    DatabaseManager
)


logging.basicConfig(level=logging.INFO)

logger = setup_logger()


app = FastAPI(

    title="UrbanFlowAI",

    version="1.0.0",

    description=(
        "AI Powered Smart Traffic "
        "Management System"
    )
)


app.add_exception_handler(
    Exception,
    global_exception_handler
)


app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


vehicle_detector = VehicleDetector()

traffic_analyzer = TrafficAnalyzer()

predictive_engine = PredictiveEngine()

signal_engine = AdaptiveSignalEngine()

emergency_router = EmergencyRouter()

db_manager = DatabaseManager()


class ConnectionManager:

    def __init__(self):

        self.active_connections: List[
            WebSocket
        ] = []

    async def connect(
        self,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.active_connections.append(
            websocket
        )

    def disconnect(
        self,
        websocket: WebSocket
    ):

        if websocket in self.active_connections:

            self.active_connections.remove(
                websocket
            )

    async def broadcast(
        self,
        message: Dict
    ):

        disconnected_clients = []

        for connection in (
            self.active_connections
        ):

            try:

                await connection.send_json(
                    message
                )

            except Exception:

                disconnected_clients.append(
                    connection
                )

        for client in disconnected_clients:

            self.disconnect(client)


manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():

    logger.info(
        "Starting UrbanFlowAI Backend..."
    )

    await db_manager.connect()

    asyncio.create_task(
        continuous_optimization()
    )

    asyncio.create_task(
        predictive_analysis()
    )


@app.on_event("shutdown")
async def shutdown_event():

    logger.info(
        "Shutting down UrbanFlowAI..."
    )

    await db_manager.disconnect()


@app.get("/")
async def root():

    return {

        "message":
            "UrbanFlowAI Backend Running",

        "status": "ACTIVE",

        "version": "1.0.0"
    }


@app.get(
    "/health",
    response_model=HealthResponse
)
async def health_check():

    return {

        "server": "healthy",

        "database": "connected",

        "ai_engine": "active",

        "traffic_system": "running",

        "timestamp":
            datetime.now().isoformat()
    }


@app.post("/api/traffic/upload-video")
async def upload_video(
    file: UploadFile = File(...)
):

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".mp4"
        ) as temp_video:

            content = await file.read()

            temp_video.write(content)

            temp_path = temp_video.name

        analysis_result = (
            await vehicle_detector.process_video(
                temp_path
            )
        )

        traffic_record = {

            "junction_id": "J001",

            "total_vehicles":
                analysis_result.get(
                    "total_vehicles",
                    0
                ),

            "density":

                85 if
                analysis_result.get(
                    "congestion_level"
                ) == "HIGH"

                else 55 if
                analysis_result.get(
                    "congestion_level"
                ) == "MEDIUM"

                else 25,

            "congestion_score":

                round(
                    analysis_result.get(
                        "total_vehicles",
                        0
                    ) / 10,
                    2
                ),

            "source": "YOLO_AI"
        }

        await db_manager.store_traffic_data(
            traffic_record
        )

        os.remove(temp_path)

        return {

            "success": True,

            "analysis": analysis_result,

            "stored_data": traffic_record,

            "timestamp":
                datetime.now().isoformat()
        }

    except Exception as e:

        logger.error(
            f"Video upload failed: {e}"
        )

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )


@app.get(
    "/api/traffic/live",
    response_model=APIResponse
)
async def get_live_traffic():

    data = await db_manager.get_live_traffic_data()

    return {

        "success": True,

        "message": "Live traffic data fetched successfully",

        "data": data
    }

    data = await db_manager.get_live_traffic_data()

    return {

        "success": True,

        "data": data
    }


@app.get("/api/traffic/live-data")
async def get_live_data():

    stats = await db_manager.get_statistics()

    return {

        "success": True,

        "data": {

            "totalVehicles":
                stats.get(
                    "total_vehicles",
                    0
                ),

            "activeDensity":
                stats.get(
                    "average_density",
                    0
                ),

            "activeIncidents":
                stats.get(
                    "active_incidents",
                    0
                ),

            "trafficStatus": "HIGH",

            "averageSpeed": 42,

            "signalsOptimized":
                stats.get(
                    "optimized_signals",
                    12
                )
        }
    }


@app.get("/api/analytics/heatmap")
async def get_heatmap_data():

    return {

        "success": True,

        "heatmap": [

            {
                "junction": "Junction A",
                "density": 85,
                "lat": 19.0760,
                "lng": 72.8777
            },

            {
                "junction": "Junction B",
                "density": 62,
                "lat": 19.0820,
                "lng": 72.8810
            },

            {
                "junction": "Junction C",
                "density": 91,
                "lat": 19.0745,
                "lng": 72.8700
            }
        ]
    }


@app.get("/api/signals/status")
async def get_signal_status():

    signals = (
        await signal_engine.get_all_signals()
    )

    return {

        "success": True,

        "signals": signals
    }


@app.post("/api/signals/optimize")
async def optimize_signals(
    junction_id: str
):

    try:

        traffic_data = (
            await db_manager.get_junction_traffic(
                junction_id
            )
        )

        optimized = (
            signal_engine.optimize_timing(
                traffic_data
            )
        )

        await signal_engine.apply_timing(
            junction_id,
            optimized
        )

        await manager.broadcast({

            "type": "SIGNAL_UPDATE",

            "junction_id": junction_id,

            "timing": optimized
        })

        return {

            "success": True,

            "optimized_timing":
                optimized
        }

    except Exception as e:

        logger.error(
            f"Signal optimization failed: {e}"
        )

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )


@app.get("/api/analytics/predictions")
async def congestion_prediction():

    historical_data = (
        await db_manager.get_historical_traffic()
    )

    prediction = (
        predictive_engine.predict_congestion(
            historical_data
        )
    )

    return {

        "success": True,

        "prediction": prediction
    }


@app.get(
    "/api/analytics/statistics",
    response_model=APIResponse
)
async def statistics():

    stats = await db_manager.get_statistics()

    return {

        "success": True,

        "message": "Statistics fetched successfully",

        "data": stats
    }

    stats = await db_manager.get_statistics()

    return {

        "success": True,

        "statistics": stats
    }


@app.post("/api/incidents/report")
async def report_incident(
    incident: IncidentReport
):

    incident_id = (
        await db_manager.create_incident(
            incident
        )
    )

    return {

        "success": True,

        "incident_id": incident_id
    }


@app.websocket("/ws/live-updates")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(websocket)

    try:

        while True:

            live_data = (
                await db_manager.get_live_traffic_data()
            )

            await websocket.send_json({

                "type": "LIVE_TRAFFIC",

                "data": live_data,

                "timestamp":
                    datetime.now().isoformat()
            })

            await asyncio.sleep(5)

    except WebSocketDisconnect:

        manager.disconnect(websocket)


async def continuous_optimization():

    while True:

        try:

            junctions = (
                await db_manager.get_all_junctions()
            )

            for junction in junctions:

                traffic_data = (
                    await db_manager.get_junction_traffic(
                        junction["id"]
                    )
                )

                if (
                    traffic_analyzer
                    .needs_optimization(
                        traffic_data
                    )
                ):

                    optimized = (
                        signal_engine
                        .optimize_timing(
                            traffic_data
                        )
                    )

                    await signal_engine.apply_timing(

                        junction["id"],

                        optimized
                    )

        except Exception as e:

            logger.error(
                f"Optimization loop error: {e}"
            )

        await asyncio.sleep(30)


async def predictive_analysis():

    while True:

        try:

            historical_data = (
                await db_manager.get_historical_traffic()
            )

            predictions = (
                predictive_engine
                .predict_congestion(
                    historical_data
                )
            )

            await manager.broadcast({

                "type": "PREDICTION_UPDATE",

                "predictions": predictions
            })

        except Exception as e:

            logger.error(
                f"Prediction loop error: {e}"
            )

        await asyncio.sleep(300)


if __name__ == "__main__":

    uvicorn.run(

        "app.main:app",

        host="0.0.0.0",

        port=8000,

        reload=True
    )