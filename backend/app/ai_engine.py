from datetime import datetime
from typing import Dict, List
import random

# Optional AI imports
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

        self.vehicle_classes = {
            "car": 2,
            "motorcycle": 3,
            "bus": 5,
            "truck": 7,
            "bicycle": 1
        }

        if self.ai_enabled:
            try:
                self.model = YOLO(model_path)
                print("YOLOv8 model loaded successfully")

            except Exception as e:
                print(f"YOLO loading failed: {e}")
                self.ai_enabled = False

    async def process_video(self, video_path: str) -> Dict:

        if not self.ai_enabled:

            return {
                "mode": "mock",
                "video_processed": True,
                "total_vehicles": random.randint(80, 250),
                "congestion_level": random.choice(
                    ["LOW", "MEDIUM", "HIGH"]
                ),
                "timestamp": datetime.now().isoformat()
            }

        return await self._process_with_ai(video_path)

    async def _process_with_ai(self, video_path: str) -> Dict:

        cap = cv2.VideoCapture(video_path)

        frame_count = 0
        total_vehicles = 0

        vehicle_breakdown = {
            "cars": 0,
            "bikes": 0,
            "buses": 0,
            "trucks": 0
        }

        while cap.isOpened():

            ret, frame = cap.read()

            if not ret:
                break

            frame_count += 1

            if frame_count % 5 == 0:

                detections = await self.detect_vehicles_from_frame(frame)

                total_vehicles += detections["total_vehicles"]

                breakdown = detections["vehicle_breakdown"]

                vehicle_breakdown["cars"] += breakdown["car"]
                vehicle_breakdown["bikes"] += breakdown["motorcycle"]
                vehicle_breakdown["buses"] += breakdown["bus"]
                vehicle_breakdown["trucks"] += breakdown["truck"]

        cap.release()

        congestion = self._calculate_congestion(total_vehicles)

        return {
            "mode": "ai",
            "frames_processed": frame_count,
            "total_vehicles": total_vehicles,
            "vehicle_breakdown": vehicle_breakdown,
            "congestion_level": congestion,
            "timestamp": datetime.now().isoformat()
        }

    async def detect_vehicles(self, frame_data: Dict):

        if not self.ai_enabled:

            return {
                "mode": "mock",
                "total_vehicles": random.randint(20, 120),
                "vehicle_breakdown": {
                    "cars": random.randint(10, 40),
                    "motorcycle": random.randint(5, 50),
                    "bus": random.randint(1, 10),
                    "truck": random.randint(1, 8)
                }
            }

        frame = self._decode_frame(frame_data)

        return await self.detect_vehicles_from_frame(frame)

    async def detect_vehicles_from_frame(self, frame):

        results = self.model(frame, verbose=False)[0]

        vehicles = []

        vehicle_counts = {
            "car": 0,
            "motorcycle": 0,
            "bus": 0,
            "truck": 0,
            "bicycle": 0
        }

        for detection in results.boxes.data:

            x1, y1, x2, y2, conf, cls = detection

            class_id = int(cls)

            vehicle_type = self._get_vehicle_type(class_id)

            if vehicle_type:

                vehicles.append({
                    "type": vehicle_type,
                    "confidence": float(conf)
                })

                vehicle_counts[vehicle_type] += 1

        return {
            "mode": "ai",
            "total_vehicles": len(vehicles),
            "vehicle_breakdown": vehicle_counts,
            "vehicles": vehicles,
            "timestamp": datetime.now().isoformat()
        }

    def is_emergency_vehicle(self, vehicle_data: Dict):

        emergency_types = [
            "ambulance",
            "fire_truck",
            "police"
        ]

        return vehicle_data.get(
            "vehicle_type", ""
        ).lower() in emergency_types

    def _get_vehicle_type(self, class_id: int):

        for vehicle_type, class_value in self.vehicle_classes.items():

            if class_id == class_value:
                return vehicle_type

        return None

    def _calculate_congestion(self, total_vehicles: int):

        if total_vehicles > 200:
            return "HIGH"

        elif total_vehicles > 100:
            return "MEDIUM"

        return "LOW"

    def _decode_frame(self, frame_data: Dict):

        return np.zeros((720, 1280, 3), dtype=np.uint8)


class TrafficAnalyzer:

    def analyze_density(self, vehicle_data: Dict):

        total = vehicle_data["total_vehicles"]

        if total > 100:
            density = "HIGH"

        elif total > 50:
            density = "MEDIUM"

        else:
            density = "LOW"

        return {
            "density_level": density,
            "lane_occupancy": random.uniform(40, 95)
        }

    def calculate_congestion(self, density_analysis: Dict):

        density = density_analysis["density_level"]

        scores = {
            "LOW": 25,
            "MEDIUM": 60,
            "HIGH": 90
        }

        return scores.get(density, 0)

    def needs_optimization(self, traffic_data: Dict):

        return traffic_data.get(
            "vehicle_count", 0
        ) > 80

    async def generate_heatmap(self):

        return [
            {
                "junction": "JNC-101",
                "intensity": 0.9
            },
            {
                "junction": "JNC-102",
                "intensity": 0.6
            }
        ]


class PredictiveEngine:

    def predict_congestion(
        self,
        historical_data,
        hours_ahead=1
    ):

        return {
            "prediction": random.choice(
                [
                    "LOW TRAFFIC",
                    "MEDIUM TRAFFIC",
                    "HIGH TRAFFIC"
                ]
            ),
            "hours_ahead": hours_ahead,
            "confidence": "89%",
            "timestamp": datetime.now().isoformat()
        }