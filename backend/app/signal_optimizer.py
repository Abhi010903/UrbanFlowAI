from typing import Dict, List
from datetime import datetime
import numpy as np
import random


class AdaptiveSignalEngine:

    def __init__(self):

        self.signals = {}

        self.min_green_time = 10
        self.max_green_time = 90

        self.yellow_time = 3
        self.all_red_time = 2

    def optimize_timing(self, traffic_data: Dict) -> Dict:

        
        junction_id = traffic_data.get(
            "junction_id",
            "UNKNOWN"
        )

        lane_densities = traffic_data.get(
            "lane_densities",
            {}
        )

        vehicle_counts = traffic_data.get(
            "vehicle_counts",
            {}
        )

        waiting_times = traffic_data.get(
            "waiting_times",
            {}
        )

        phases = self._calculate_phase_timings(
            lane_densities,
            vehicle_counts,
            waiting_times
        )

        phases = self._apply_constraints(phases)

        total_cycle_time = sum(
            phase["green_time"] +
            self.yellow_time +
            self.all_red_time
            for phase in phases
        )

        return {
            "junction_id": junction_id,
            "phases": phases,
            "total_cycle_time": total_cycle_time,
            "optimization_strategy": "adaptive_density_based",
            "timestamp": datetime.now().isoformat()
        }

    def _calculate_phase_timings(
        self,
        lane_densities: Dict,
        vehicle_counts: Dict,
        waiting_times: Dict
    ) -> List[Dict]:

        
        phases = []

        phase_configs = [
            {
                "phase_name": "North-South",
                "lanes": ["N", "S"]
            },
            {
                "phase_name": "East-West",
                "lanes": ["E", "W"]
            },
            {
                "phase_name": "North-East Turn",
                "lanes": ["NE"]
            },
            {
                "phase_name": "South-West Turn",
                "lanes": ["SW"]
            }
        ]

        phase_demands = []

        for config in phase_configs:

            demand_score = 0

            for lane in config["lanes"]:

                density = lane_densities.get(lane, 0)

                vehicle_count = vehicle_counts.get(
                    lane,
                    0
                )

                waiting_time = waiting_times.get(
                    lane,
                    0
                )

                lane_demand = (
                    density * 0.4 +
                    vehicle_count * 0.3 +
                    waiting_time * 0.3
                )

                demand_score += lane_demand

            phase_demands.append(demand_score)

        total_demand = sum(phase_demands)

        if total_demand == 0:

            phase_demands = [1] * len(phase_configs)

            total_demand = len(phase_configs)

        available_green_time = 120

        for index, config in enumerate(phase_configs):

            proportion = (
                phase_demands[index] / total_demand
            )

            green_time = (
                available_green_time * proportion
            )

            phases.append({
                "phase_id": index + 1,
                "phase_name": config["phase_name"],
                "lanes": config["lanes"],
                "green_time": green_time,
                "yellow_time": self.yellow_time,
                "all_red_time": self.all_red_time,
                "demand_score": round(
                    phase_demands[index],
                    2
                )
            })

        return phases

    def _apply_constraints(
        self,
        phases: List[Dict]
    ) -> List[Dict]:

        for phase in phases:

            if phase["green_time"] < self.min_green_time:

                phase["green_time"] = (
                    self.min_green_time
                )

            if phase["green_time"] > self.max_green_time:

                phase["green_time"] = (
                    self.max_green_time
                )

            phase["green_time"] = int(
                round(phase["green_time"])
            )

        return phases

    async def get_all_signals(self) -> List[Dict]:

        return [
            {
                "junction_id": "J001",
                "junction_name": "Vadodara Circle",
                "status": "GREEN",
                "current_phase": "North-South",
                "time_remaining": 45,
                "traffic_density": "HIGH"
            },
            {
                "junction_id": "J002",
                "junction_name": "Railway Junction",
                "status": "RED",
                "current_phase": "East-West",
                "time_remaining": 28,
                "traffic_density": "MEDIUM"
            },
            {
                "junction_id": "J003",
                "junction_name": "University Road",
                "status": "YELLOW",
                "current_phase": "Turn Lane",
                "time_remaining": 5,
                "traffic_density": "LOW"
            }
        ]

    async def apply_timing(
        self,
        junction_id: str,
        optimized_timing: Dict
    ) -> Dict:

        self.signals[junction_id] = {
            "timing": optimized_timing,
            "updated_at": datetime.now().isoformat(),
            "status": "ACTIVE"
        }

        return {
            "success": True,
            "junction_id": junction_id,
            "message": "Signal timing updated successfully"
        }

    def calculate_coordination(
        self,
        junction_ids: List[str]
    ) -> Dict:

        coordination_plan = {
            "strategy": "green_wave",
            "junctions": [],
            "bandwidth_efficiency": "87%"
        }

        for index, junction_id in enumerate(junction_ids):

            coordination_plan["junctions"].append({
                "junction_id": junction_id,
                "offset_seconds": index * 15
            })

        return coordination_plan


class ReinforcementLearningOptimizer:

    def __init__(self):

        self.q_table = {}

        self.learning_rate = 0.1

        self.discount_factor = 0.95

        self.epsilon = 0.1

        self.min_green_time = 10

        self.max_green_time = 90

    def get_state(
        self,
        traffic_data: Dict
    ) -> str:

        density = traffic_data.get(
            "density",
            0
        )

        if density < 30:

            return "LOW"

        elif density < 60:

            return "MEDIUM"

        return "HIGH"

    def choose_action(
        self,
        state: str
    ) -> int:

        if random.random() < self.epsilon:

            return int(
                np.random.randint(
                    self.min_green_time,
                    self.max_green_time
                )
            )

        if state in self.q_table:

            return max(
                self.q_table[state],
                key=self.q_table[state].get
            )

        return 45

    def update_q_value(
        self,
        state: str,
        action: int,
        reward: float,
        next_state: str
    ):

        if state not in self.q_table:

            self.q_table[state] = {}

        current_q = self.q_table[state].get(
            action,
            0
        )

        if next_state in self.q_table:

            max_next_q = max(
                self.q_table[next_state].values()
            )

        else:

            max_next_q = 0

        updated_q = current_q + self.learning_rate * (
            reward +
            self.discount_factor *
            max_next_q -
            current_q
        )

        self.q_table[state][action] = updated_q

    def calculate_reward(
        self,
        traffic_metrics: Dict
    ) -> float:

        waiting_time_reduction = traffic_metrics.get(
            "waiting_time_reduction",
            0
        )

        throughput_increase = traffic_metrics.get(
            "throughput_increase",
            0
        )

        congestion_decrease = traffic_metrics.get(
            "congestion_decrease",
            0
        )

        reward = (
            waiting_time_reduction * 0.4 +
            throughput_increase * 0.3 +
            congestion_decrease * 0.3
        )

        return round(reward, 2)


__all__ = [
    "AdaptiveSignalEngine",
    "ReinforcementLearningOptimizer"
]