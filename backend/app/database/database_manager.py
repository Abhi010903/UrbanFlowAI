import asyncpg
import logging
import json
from typing import Dict, List
from datetime import datetime, timedelta
from app.config import settings
logger = logging.getLogger(__name__)
class DatabaseManager:

    def __init__(self):

        self.pool = None

    async def connect(self):

        try:

            self.pool = await asyncpg.create_pool(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                min_size=5,
                max_size=20
            )

            logger.info("Database connection established")

            await self._create_tables()

        except Exception as error:

            logger.error(f"Database connection failed: {error}")

            raise error

    async def disconnect(self):

        if self.pool:

            await self.pool.close()

            logger.info("Database connection closed")

    async def _create_tables(self):

        async with self.pool.acquire() as conn:

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS junctions (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    zone VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS traffic_data (
                    id SERIAL PRIMARY KEY,
                    junction_id VARCHAR(50) REFERENCES junctions(id),
                    timestamp TIMESTAMP,
                    vehicle_count INTEGER,
                    density_percentage DECIMAL(5, 2),
                    congestion_score DECIMAL(5, 2),
                    source VARCHAR(50)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS emergency_events (
                    id SERIAL PRIMARY KEY,
                    vehicle_type VARCHAR(50),
                    start_location JSONB,
                    destination JSONB,
                    route_path JSONB,
                    corridor_id VARCHAR(100),
                    activated_at TIMESTAMP,
                    status VARCHAR(20)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id SERIAL PRIMARY KEY,
                    junction_id VARCHAR(50) REFERENCES junctions(id),
                    incident_type VARCHAR(50),
                    severity VARCHAR(20),
                    description TEXT,
                    location JSONB,
                    reported_at TIMESTAMP,
                    status VARCHAR(20)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id SERIAL PRIMARY KEY,
                    junction_id VARCHAR(50),
                    prediction JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_traffic_timestamp
                ON traffic_data(timestamp)
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_traffic_junction
                ON traffic_data(junction_id)
            """)

            logger.info("Database tables initialized")

            await self._insert_sample_junctions(conn)

    async def _insert_sample_junctions(self, conn):

        junctions = [
            ("J001", "Vadodara Circle", 23.0225, 72.5714, "Central"),
            ("J002", "Railway Junction", 23.0335, 72.5850, "East"),
            ("J003", "University Road", 23.0145, 72.5640, "South")
        ]

        for junction in junctions:

            await conn.execute("""
                INSERT INTO junctions (
                    id,
                    name,
                    latitude,
                    longitude,
                    zone
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id)
                DO NOTHING
            """, *junction)

    async def store_traffic_data(self, data: Dict):

        try:

            async with self.pool.acquire() as conn:

                await conn.execute("""
                    INSERT INTO traffic_data (
                        junction_id,
                        timestamp,
                        vehicle_count,
                        density_percentage,
                        congestion_score,
                        source
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                """,
                    data.get("junction_id", "J001"),
                    datetime.now(),
                    data.get("total_vehicles", 0),
                    data.get("density", 0),
                    data.get("congestion_score", 0),
                    data.get("source", "AI_CAMERA")
                )

        except Exception as error:

            logger.error(f"Traffic data insert failed: {error}")

    async def get_live_traffic_data(self) -> List[Dict]:

        try:

            async with self.pool.acquire() as conn:

                rows = await conn.fetch("""
                    SELECT DISTINCT ON (junction_id)
                        junction_id,
                        vehicle_count,
                        density_percentage,
                        congestion_score,
                        timestamp
                    FROM traffic_data
                    ORDER BY junction_id, timestamp DESC
                """)

                return [dict(row) for row in rows]

        except Exception as error:

            logger.error(f"Live traffic fetch failed: {error}")

            return []

    async def get_junction_traffic(
        self,
        junction_id: str
    ) -> Dict:

        try:

            async with self.pool.acquire() as conn:

                row = await conn.fetchrow("""
                    SELECT *
                    FROM traffic_data
                    WHERE junction_id = $1
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, junction_id)

                if row:

                    return {
                        "junction_id": row["junction_id"],
                        "vehicle_count": row["vehicle_count"],
                        "density": float(row["density_percentage"] or 0),
                        "congestion_score": float(row["congestion_score"] or 0),

                        "lane_densities": {
                            "N": 45,
                            "S": 50,
                            "E": 60,
                            "W": 55
                        },

                        "vehicle_counts": {
                            "N": 12,
                            "S": 15,
                            "E": 18,
                            "W": 14
                        },

                        "waiting_times": {
                            "N": 30,
                            "S": 25,
                            "E": 40,
                            "W": 35
                        }
                    }

                return {}

        except Exception as error:

            logger.error(f"Junction fetch failed: {error}")

            return {}

    async def get_all_junctions(self) -> List[Dict]:

        try:

            async with self.pool.acquire() as conn:

                rows = await conn.fetch("""
                    SELECT *
                    FROM junctions
                """)

                return [dict(row) for row in rows]

        except Exception as error:

            logger.error(f"Junction fetch failed: {error}")

            return []

    async def log_emergency_event(
        self,
        vehicle_data: Dict,
        route: Dict
    ):

        try:

            async with self.pool.acquire() as conn:

                await conn.execute("""
                    INSERT INTO emergency_events (
                        vehicle_type,
                        start_location,
                        destination,
                        route_path,
                        corridor_id,
                        activated_at,
                        status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                    vehicle_data.get("type", "ambulance"),
                    json.dumps(vehicle_data.get("location", {})),
                    json.dumps(vehicle_data.get("destination", {})),
                    json.dumps(route.get("path", [])),
                    route.get("corridor_id", ""),
                    datetime.now(),
                    "ACTIVE"
                )

        except Exception as error:

            logger.error(f"Emergency log failed: {error}")

    async def create_incident(
        self,
        incident: Dict
    ) -> int:

        try:

            async with self.pool.acquire() as conn:

                incident_id = await conn.fetchval("""
                    INSERT INTO incidents (
                        junction_id,
                        incident_type,
                        severity,
                        description,
                        location,
                        reported_at,
                        status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                """,
                    incident.get("junction_id"),
                    incident.get("type", "ACCIDENT"),
                    incident.get("severity", "MEDIUM"),
                    incident.get("description", ""),
                    json.dumps(incident.get("location", {})),
                    datetime.now(),
                    "ACTIVE"
                )

                return incident_id

        except Exception as error:

            logger.error(f"Incident creation failed: {error}")

            return 0

    async def get_historical_traffic(
        self,
        hours: int = 24
    ) -> List[Dict]:

        try:

            async with self.pool.acquire() as conn:

                cutoff_time = datetime.now() - timedelta(hours=hours)

                rows = await conn.fetch("""
                    SELECT
                        junction_id,
                        vehicle_count,
                        density_percentage,
                        congestion_score,
                        timestamp
                    FROM traffic_data
                    WHERE timestamp >= $1
                    ORDER BY timestamp ASC
                """, cutoff_time)

                return [dict(row) for row in rows]

        except Exception as error:

            logger.error(f"Historical traffic fetch failed: {error}")

            return []

    async def get_statistics(self):

        try:

            async with self.pool.acquire() as connection:

                total_vehicles = await connection.fetchval("""
                    SELECT COALESCE(SUM(vehicle_count), 0)
                    FROM traffic_data
                """)

                average_density = await connection.fetchval("""
                    SELECT COALESCE(AVG(density_percentage), 0)
                    FROM traffic_data
                """)

                active_incidents = await connection.fetchval("""
                    SELECT COUNT(*)
                    FROM incidents
                    WHERE status = 'ACTIVE'
                """)

                return {
                    "total_vehicles": total_vehicles or 0,
                    "average_density": round(float(average_density or 0), 2),
                    "active_incidents": active_incidents or 0,
                    "optimized_signals": 12
                }

        except Exception as error:

            logger.error(f"Statistics fetch failed: {error}")

            return {
                "total_vehicles": 0,
                "average_density": 0,
                "active_incidents": 0,
                "optimized_signals": 0
            }


__all__ = ["DatabaseManager"]