import React, { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    averageDensity: 0,
    activeIncidents: 0,
    optimizedSignals: 0,
  });

  const [trafficData, setTrafficData] = useState([]);

  const [vehicleData, setVehicleData] = useState([]);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch(
        "http://127.0.0.1:8000/api/analytics/statistics"
      );

      const statsJson = await statsResponse.json();

      if (statsJson.data) {

  setStats({

    totalVehicles:
      statsJson.data.total_vehicles || 0,

    averageDensity:
      Number(
        statsJson.data.average_density || 0
      ).toFixed(1),

    activeIncidents:
      statsJson.data.active_incidents || 0,

    optimizedSignals:
      statsJson.data.optimized_signals || 0,
  });
}
      

      const trafficResponse = await fetch(
        "http://127.0.0.1:8000/api/traffic/live"
      );

      const trafficJson = await trafficResponse.json();

      if (trafficJson.data) {
        setTrafficData(trafficJson.data);

        let totalVehicles = 0;

        trafficJson.data.forEach((junction) => {
          totalVehicles += junction.vehicle_count || 0;
        });

        setVehicleData([
          {
            name: "Cars",
            value: Math.floor(totalVehicles * 0.6),
          },
          {
            name: "Bikes",
            value: Math.floor(totalVehicles * 0.2),
          },
          {
            name: "Buses",
            value: Math.floor(totalVehicles * 0.1),
          },
          {
            name: "Trucks",
            value: Math.floor(totalVehicles * 0.1),
          },
        ]);
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    }
  };

  const trafficTrendData = [
    { time: "6 AM", density: 35 },
    { time: "8 AM", density: 70 },
    { time: "10 AM", density: 55 },
    { time: "12 PM", density: 60 },
    { time: "2 PM", density: 72 },
    { time: "4 PM", density: 82 },
    { time: "6 PM", density: 91 },
    { time: "8 PM", density: 58 },
  ];

  const congestionZoneData = [
    { zone: "Central", congestion: 82 },
    { zone: "North", congestion: 58 },
    { zone: "South", congestion: 44 },
    { zone: "East", congestion: 76 },
    { zone: "West", congestion: 61 },
  ];

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-top">
        <div>
          <h1>UrbanFlowAI Dashboard</h1>
          <p>Smart Traffic Monitoring & Analytics</p>
        </div>

        <div className="live-status">
          <span className="live-dot"></span>
          Live System
        </div>
      </div>

      <div className="metrics-grid">

  <div className="metric-card">

    <h2>
      {stats.totalVehicles}
    </h2>

    <p>Total Vehicles</p>

  </div>

  <div className="metric-card">

    <h2>
      {Number(
        stats.averageDensity
      ).toFixed(1)}%
    </h2>

    <p>Average Density</p>

  </div>

  <div className="metric-card">

    <h2>
      {stats.activeIncidents}
    </h2>

    <p>Active Incidents</p>

  </div>

  <div className="metric-card">

    <h2>
      {stats.optimizedSignals}
    </h2>

    <p>Optimized Signals</p>

  </div>

</div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Traffic Density Trend</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficTrendData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="time" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="density"
                stroke="#3B82F6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Congestion By Zone</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={congestionZoneData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="zone" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="congestion"
                fill="#F59E0B"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Vehicle Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehicleData}
                dataKey="value"
                outerRadius={100}
                label
              >
                {vehicleData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Live Junction Status</h3>

          <div className="junction-list">
            {trafficData.slice(0, 6).map((junction, index) => (
              <div
                className="junction-item"
                key={index}
              >
                <div className="junction-top">
                  <span>{junction.junction_id}</span>

                  <span>
                    {junction.vehicle_count || 0} vehicles
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        junction.density_percentage || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="activity-card">
        <h3>Recent Activity</h3>

        <div className="activity-item">
          🚦 Signal optimization completed
        </div>

        <div className="activity-item">
          ⚠️ Congestion detected at central zone
        </div>

        <div className="activity-item">
          🚑 Emergency corridor activated
        </div>

        <div className="activity-item">
          📈 Predictive analysis updated
        </div>
      </div>
    </div>
  );
};

export default Dashboard;