from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class VehicleBreakdown(BaseModel):

    cars: int = 0
    bikes: int = 0
    buses: int = 0
    trucks: int = 0
    emergency: int = 0


class TrafficData(BaseModel):

    junction_id: str
    total_vehicles: int
    density: float
    congestion_score: float

    vehicle_breakdown: VehicleBreakdown

    timestamp: Optional[datetime] = datetime.now()


class SignalPhase(BaseModel):

    phase_id: int
    name: str
    green_time: int
    yellow_time: int
    red_time: int


class SignalTiming(BaseModel):

    junction_id: str

    total_cycle_time: int

    phases: List[SignalPhase]

    optimization_timestamp: Optional[datetime] = datetime.now()


class EmergencyLocation(BaseModel):

    lat: float
    lng: float


class EmergencyVehicle(BaseModel):

    type: str

    location: EmergencyLocation

    destination: EmergencyLocation

    priority_level: Optional[int] = 1

    has_sirens: Optional[bool] = True


class IncidentReport(BaseModel):

    junction_id: str

    type: str

    severity: str

    description: Optional[str] = ""

    location: Dict

    reported_by: Optional[str] = "system"


class PredictionHotspot(BaseModel):

    junction_id: str

    expected_congestion: float


class CongestionPrediction(BaseModel):

    hour: int

    predicted_density: float

    confidence: float

    hotspots: List[PredictionHotspot]


class AnalyticsResponse(BaseModel):

    total_vehicles_processed: int

    average_density: float

    average_congestion: float

    peak_congestion: float

    total_incidents: int

    timeframe: str

class HealthResponse(BaseModel):

    server: str

    database: str

    ai_engine: str

    traffic_system: str

    timestamp: str

class APIResponse(BaseModel):

    success: bool

    message: str

    data: Dict | List | None = None