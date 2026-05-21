import heapq
from typing import Dict, List, Tuple
from datetime import datetime
import math
import logging


logger = logging.getLogger(__name__)


class EmergencyRouter:

    def __init__(self):

        self.road_network = self._build_road_network()

        self.active_corridors = []

    def _build_road_network(self) -> Dict:

        return {

            "J001": {
                "neighbors": [
                    ("J002", 120),
                    ("J005", 180)
                ],
                "location": {
                    "lat": 23.0225,
                    "lng": 72.5714
                },
                "signals": ["S1", "S2"]
            },

            "J002": {
                "neighbors": [
                    ("J001", 120),
                    ("J003", 90),
                    ("J006", 150)
                ],
                "location": {
                    "lat": 23.0335,
                    "lng": 72.5850
                },
                "signals": ["S3", "S4"]
            },

            "J003": {
                "neighbors": [
                    ("J002", 90),
                    ("J004", 100),
                    ("J007", 140)
                ],
                "location": {
                    "lat": 23.0145,
                    "lng": 72.5640
                },
                "signals": ["S5", "S6"]
            },

            "J004": {
                "neighbors": [
                    ("J003", 100),
                    ("J008", 110)
                ],
                "location": {
                    "lat": 23.0425,
                    "lng": 72.5920
                },
                "signals": ["S7", "S8"]
            },

            "J005": {
                "neighbors": [
                    ("J001", 180),
                    ("J006", 95)
                ],
                "location": {
                    "lat": 23.0180,
                    "lng": 72.5580
                },
                "signals": ["S9", "S10"]
            },

            "J006": {
                "neighbors": [
                    ("J002", 150),
                    ("J005", 95),
                    ("J007", 130)
                ],
                "location": {
                    "lat": 23.0290,
                    "lng": 72.5690
                },
                "signals": ["S11", "S12"]
            },

            "J007": {
                "neighbors": [
                    ("J003", 140),
                    ("J006", 130),
                    ("J008", 85)
                ],
                "location": {
                    "lat": 23.0385,
                    "lng": 72.5775
                },
                "signals": ["S13", "S14"]
            },

            "J008": {
                "neighbors": [
                    ("J004", 110),
                    ("J007", 85)
                ],
                "location": {
                    "lat": 23.0505,
                    "lng": 72.6010
                },
                "signals": ["S15", "S16"]
            }
        }

    def calculate_route(
        self,
        start_location: Dict,
        destination_location: Dict
    ) -> Dict:

        start_junction = self._find_nearest_junction(
            start_location
        )

        destination_junction = (
            self._find_nearest_junction(
                destination_location
            )
        )

        path, total_time = self._dijkstra(
            start_junction,
            destination_junction
        )

        if not path:

            return {
                "success": False,
                "message": "No valid route found"
            }

        return {
            "success": True,
            "start_junction": start_junction,
            "destination_junction": destination_junction,
            "path": path,
            "estimated_time_seconds": total_time,
            "estimated_distance_km": round(
                len(path) * 0.8,
                2
            ),
            "signals_to_control":
                self._get_signals_on_route(path),
            "timestamp":
                datetime.now().isoformat()
        }

    def _dijkstra(
        self,
        start: str,
        destination: str
    ) -> Tuple[List[str], int]:

        distances = {
            node: float("inf")
            for node in self.road_network
        }

        distances[start] = 0

        previous_nodes = {
            node: None
            for node in self.road_network
        }

        priority_queue = [(0, start)]

        visited = set()

        while priority_queue:

            current_distance, current_node = (
                heapq.heappop(priority_queue)
            )

            if current_node in visited:
                continue

            visited.add(current_node)

            if current_node == destination:
                break

            for neighbor, travel_time in (
                self.road_network[current_node][
                    "neighbors"
                ]
            ):

                congestion_factor = 1.0

                adjusted_travel_time = (
                    travel_time * congestion_factor
                )

                distance = (
                    current_distance +
                    adjusted_travel_time
                )

                if distance < distances[neighbor]:

                    distances[neighbor] = distance

                    previous_nodes[neighbor] = (
                        current_node
                    )

                    heapq.heappush(
                        priority_queue,
                        (distance, neighbor)
                    )

        if distances[destination] == float("inf"):

            return [], 0

        path = []

        current = destination

        while current:

            path.append(current)

            current = previous_nodes[current]

        path.reverse()

        return path, int(distances[destination])

    def _find_nearest_junction(
        self,
        location: Dict
    ) -> str:

        min_distance = float("inf")

        nearest_junction = None

        for junction_id, junction_data in (
            self.road_network.items()
        ):

            junction_lat = (
                junction_data["location"]["lat"]
            )

            junction_lng = (
                junction_data["location"]["lng"]
            )

            distance = math.sqrt(
                (
                    location["lat"] - junction_lat
                ) ** 2 +
                (
                    location["lng"] - junction_lng
                ) ** 2
            )

            if distance < min_distance:

                min_distance = distance

                nearest_junction = junction_id

        return nearest_junction

    def _get_signals_on_route(
        self,
        path: List[str]
    ) -> List[str]:

        signals = []

        for junction in path:

            signals.extend(
                self.road_network[junction][
                    "signals"
                ]
            )

        return signals

    async def create_green_corridor(
        self,
        route: Dict
    ) -> Dict:

        corridor_id = (
            f"CORRIDOR_"
            f"{datetime.now().strftime('%H%M%S')}"
        )

        path = route["path"]

        corridor_timing = []

        accumulated_time = 0

        for index, junction in enumerate(path):

            if index > 0:

                previous_junction = path[index - 1]

                for neighbor, travel_time in (
                    self.road_network[
                        previous_junction
                    ]["neighbors"]
                ):

                    if neighbor == junction:

                        accumulated_time += (
                            travel_time
                        )

                        break

            corridor_timing.append({

                "junction_id": junction,

                "signals":
                    self.road_network[
                        junction
                    ]["signals"],

                "activate_green_at":
                    max(
                        0,
                        accumulated_time - 10
                    ),

                "hold_green_for": 30,

                "priority_level": "HIGH"
            })

        corridor = {

            "corridor_id": corridor_id,

            "route": route,

            "timing": corridor_timing,

            "status": "ACTIVE",

            "created_at":
                datetime.now().isoformat()
        }

        self.active_corridors.append(corridor)

        await self._apply_corridor_signals(
            corridor
        )

        return {

            "success": True,

            "corridor_id": corridor_id,

            "timing": corridor_timing,

            "message":
                "Green corridor activated successfully"
        }

    async def _apply_corridor_signals(
        self,
        corridor: Dict
    ):

        for timing in corridor["timing"]:

            logger.info(
                f"Activating green signal "
                f"at {timing['junction_id']}"
            )

    def get_active_corridors(self):

        return [
            corridor
            for corridor in self.active_corridors
            if corridor["status"] == "ACTIVE"
        ]

    async def deactivate_corridor(
        self,
        corridor_id: str
    ):

        for corridor in self.active_corridors:

            if corridor["corridor_id"] == corridor_id:

                corridor["status"] = "INACTIVE"

                corridor[
                    "deactivated_at"
                ] = datetime.now().isoformat()

                logger.info(
                    f"Corridor {corridor_id} deactivated"
                )

                return {
                    "success": True
                }

        return {
            "success": False,
            "message": "Corridor not found"
        }


class AStarRouter:

    def __init__(
        self,
        road_network: Dict
    ):

        self.road_network = road_network

    def calculate_route(
        self,
        start: str,
        goal: str
    ):

        open_set = [(0, start)]

        came_from = {}

        g_score = {
            node: float("inf")
            for node in self.road_network
        }

        g_score[start] = 0

        while open_set:

            _, current = heapq.heappop(
                open_set
            )

            if current == goal:

                path = [current]

                while current in came_from:

                    current = came_from[current]

                    path.append(current)

                path.reverse()

                return path, int(g_score[goal])

            for neighbor, travel_time in (
                self.road_network[current][
                    "neighbors"
                ]
            ):

                tentative_score = (
                    g_score[current] +
                    travel_time
                )

                if tentative_score < g_score[neighbor]:

                    came_from[neighbor] = current

                    g_score[neighbor] = (
                        tentative_score
                    )

                    priority = tentative_score

                    heapq.heappush(
                        open_set,
                        (priority, neighbor)
                    )

        return [], 0


__all__ = [
    "EmergencyRouter",
    "AStarRouter"
]