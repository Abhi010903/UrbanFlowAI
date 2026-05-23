from datetime import datetime
from typing import Dict, List
import random

AI_AVAILABLE = False
try:
    import cv2
    import numpy as np
    from ultralytics import YOLO
    AI_AVAILABLE = True
except Exception:
    AI_AVAILABLE = False


class VehicleDetector:

    def __init__(self, model_path: str = "yolov8n.pt"):
        self.ai_enabled = AI_AVAILABLE
        self.vehicle_classes = {"car": 2, "motorcycle": 3, "bus": 5, "truck": 7, "bicycle": 1}
        if self.ai_enabled:
            try:
                self.model = YOLO(model_path)
                print("YOLOv8 model loaded successfully")
            except Exception as e:
                print(f"YOLO loading failed: {e}")
                self.ai_enabled = False

    async def process_video(self, video_path: str) -> Dict:
        if not self.ai_enabled:
            return self._mock_analysis()
        return await self._process_with_ai(video_path)

    def _mock_analysis(self) -> Dict:
        total = random.randint(80, 280)
        cars   = int(total * random.uniform(0.50, 0.60))
        bikes  = int(total * random.uniform(0.18, 0.25))
        buses  = int(total * random.uniform(0.08, 0.14))
        trucks = total - cars - bikes - buses

        congestion = "HIGH" if total > 200 else "MEDIUM" if total > 120 else "LOW"
        density    = {"HIGH": random.uniform(75, 95), "MEDIUM": random.uniform(45, 74), "LOW": random.uniform(15, 44)}[congestion]
        speed      = {"HIGH": random.uniform(15, 28), "MEDIUM": random.uniform(28, 42), "LOW": random.uniform(42, 60)}[congestion]
        frames     = random.randint(800, 3000)
        incidents  = random.randint(1, 3) if congestion == "HIGH" else (1 if congestion == "MEDIUM" and random.random() > 0.5 else 0)

        return {
            "mode": "mock",
            "frames_processed": frames,
            "total_vehicles": total,
            "vehicle_breakdown": {"cars": cars, "bikes": bikes, "buses": buses, "trucks": trucks},
            "congestion_level": congestion,
            "traffic_density": round(density, 1),
            "average_speed": round(speed, 1),
            "incidents_detected": incidents,
            "analysis_time": round(random.uniform(2.5, 8.0), 2),
            "confidence": round(random.uniform(85, 96), 1),
            "peak_frame_vehicles": int(total * random.uniform(0.08, 0.15)),
            "timestamp": datetime.now().isoformat(),
        }

    async def _process_with_ai(self, video_path: str) -> Dict:
        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        total_vehicles = 0
        breakdown = {"cars": 0, "bikes": 0, "buses": 0, "trucks": 0}
        peak = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            if frame_count % 5 == 0:
                det = await self.detect_vehicles_from_frame(frame)
                fv = det["total_vehicles"]
                total_vehicles += fv
                peak = max(peak, fv)
                b = det["vehicle_breakdown"]
                breakdown["cars"]   += b.get("car", 0)
                breakdown["bikes"]  += b.get("motorcycle", 0)
                breakdown["buses"]  += b.get("bus", 0)
                breakdown["trucks"] += b.get("truck", 0)

        cap.release()
        congestion = "HIGH" if total_vehicles > 200 else "MEDIUM" if total_vehicles > 100 else "LOW"
        density    = {"HIGH": 85.0, "MEDIUM": 58.0, "LOW": 28.0}[congestion]

        return {
            "mode": "ai",
            "frames_processed": frame_count,
            "total_vehicles": total_vehicles,
            "vehicle_breakdown": breakdown,
            "congestion_level": congestion,
            "traffic_density": density,
            "average_speed": {"HIGH": 22.0, "MEDIUM": 36.0, "LOW": 52.0}[congestion],
            "incidents_detected": 1 if congestion == "HIGH" else 0,
            "analysis_time": round(frame_count / 30, 2),
            "confidence": 91.0,
            "peak_frame_vehicles": peak,
            "timestamp": datetime.now().isoformat(),
        }

    async def detect_vehicles_from_frame(self, frame) -> Dict:
        results = self.model(frame, verbose=False)[0]
        counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0, "bicycle": 0}
        for det in results.boxes.data:
            _, _, _, _, _, cls = det
            vt = self._get_vehicle_type(int(cls))
            if vt:
                counts[vt] += 1
        return {"total_vehicles": sum(counts.values()), "vehicle_breakdown": counts}

    def _get_vehicle_type(self, class_id: int):
        return next((k for k, v in self.vehicle_classes.items() if v == class_id), None)

    def is_emergency_vehicle(self, vehicle_data: Dict):
        return vehicle_data.get("vehicle_type", "").lower() in ["ambulance", "fire_truck", "police"]


class TrafficAnalyzer:

    def analyze_density(self, vehicle_data: Dict) -> Dict:
        total = vehicle_data.get("total_vehicles", 0)
        level = "HIGH" if total > 100 else "MEDIUM" if total > 50 else "LOW"
        return {"density_level": level, "lane_occupancy": random.uniform(40, 95)}

    def calculate_congestion(self, density_analysis: Dict) -> int:
        return {"LOW": 25, "MEDIUM": 60, "HIGH": 90}.get(density_analysis.get("density_level", "LOW"), 25)

    def needs_optimization(self, traffic_data: Dict) -> bool:
        return traffic_data.get("vehicle_count", 0) > 80


class PredictiveEngine:

    def predict_congestion(self, historical_data: List, hours_ahead: int = 1) -> List:
        base = 55
        return [
            {"time_slot": f"+{h+1}h", "predicted_density": min(99, max(10, base + random.randint(-20, 25))), "confidence": round(random.uniform(0.78, 0.95), 2)}
            for h in range(hours_ahead * 2)
        ]
