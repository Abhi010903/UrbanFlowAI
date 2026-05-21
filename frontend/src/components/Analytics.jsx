import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar, Radar } from "react-chartjs-2";

import "./Analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("today");
  const [statistics, setStatistics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [timeframe]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/analytics/statistics?timeframe=${timeframe}`
      );

      const data = await response.json();

      if (data?.status === "success") {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Statistics fetch error:", error);
    }
  };

  const fetchPredictions = async (hours) => {
    setLoadingPredictions(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/analytics/congestion-prediction?hours_ahead=${hours}`
      );

      const data = await response.json();

      if (data?.status === "success") {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error("Prediction fetch error:", error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const hourlyTrafficData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),

    datasets: [
      {
        label: "Traffic Density (%)",

        data: [
          28, 35, 42, 48, 55, 68, 82, 88,
          85, 78, 72, 75, 78, 82, 85, 88,
          92, 95, 90, 82, 70, 58, 45, 32,
        ],

        fill: true,
        backgroundColor: "rgba(59,130,246,0.15)",
        borderColor: "rgb(59,130,246)",
        tension: 0.4,
      },
    ],
  };

  const zoneComparisonData = {
    labels: ["Central", "North", "South", "East", "West"],

    datasets: [
      {
        label: "Avg Congestion",
        data: [85, 72, 68, 78, 65],
        backgroundColor: "rgba(239,68,68,0.7)",
      },

      {
        label: "Peak Congestion",
        data: [95, 88, 82, 92, 78],
        backgroundColor: "rgba(251,146,60,0.7)",
      },
    ],
  };

  const performanceMetrics = {
    labels: [
      "Signal Efficiency",
      "Response Time",
      "Throughput",
      "Queue Length",
      "Wait Time Reduction",
    ],

    datasets: [
      {
        label: "Current Performance",

        data: [85, 78, 82, 70, 88],

        backgroundColor: "rgba(34,197,94,0.2)",
        borderColor: "rgb(34,197,94)",
        pointBackgroundColor: "rgb(34,197,94)",
      },

      {
        label: "Target Performance",

        data: [90, 85, 90, 80, 95],

        backgroundColor: "rgba(59,130,246,0.2)",
        borderColor: "rgb(59,130,246)",
        pointBackgroundColor: "rgb(59,130,246)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <div className="analytics">

      <div className="analytics-header">

        <h2>📊 Traffic Analytics & AI Predictions</h2>

        <div className="timeframe-selector">

          <button
            className={timeframe === "today" ? "active" : ""}
            onClick={() => setTimeframe("today")}
          >
            Today
          </button>

          <button
            className={timeframe === "week" ? "active" : ""}
            onClick={() => setTimeframe("week")}
          >
            This Week
          </button>

          <button
            className={timeframe === "month" ? "active" : ""}
            onClick={() => setTimeframe("month")}
          >
            This Month
          </button>

        </div>

      </div>

      {statistics && (
        <div className="key-statistics">

          <div className="stat-box">
            <h3>
              {statistics.total_vehicles_processed?.toLocaleString() || 0}
            </h3>
            <p>Total Vehicles</p>
          </div>

          <div className="stat-box">
            <h3>
              {statistics.average_density?.toFixed(1) || 0}%
            </h3>
            <p>Average Density</p>
          </div>

          <div className="stat-box">
            <h3>
              {statistics.peak_congestion?.toFixed(1) || 0}%
            </h3>
            <p>Peak Congestion</p>
          </div>

          <div className="stat-box">
            <h3>
              {statistics.total_incidents || 0}
            </h3>
            <p>Total Incidents</p>
          </div>

        </div>
      )}

      <div className="charts-grid">

        <div className="chart-card large">
          <h3>24-Hour Traffic Pattern</h3>

          <div className="chart-container">
            <Line
              data={hourlyTrafficData}
              options={chartOptions}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>Zone-wise Comparison</h3>

          <div className="chart-container">
            <Bar
              data={zoneComparisonData}
              options={chartOptions}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>System Performance</h3>

          <div className="chart-container">
            <Radar
              data={performanceMetrics}
              options={{
                ...chartOptions,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

      </div>

      <div className="predictive-section">

        <h3>🧠 AI Congestion Prediction</h3>

        <div className="prediction-controls">

          <button
            onClick={() => fetchPredictions(1)}
            disabled={loadingPredictions}
          >
            Predict 1 Hour
          </button>

          <button
            onClick={() => fetchPredictions(3)}
            disabled={loadingPredictions}
          >
            Predict 3 Hours
          </button>

          <button
            onClick={() => fetchPredictions(6)}
            disabled={loadingPredictions}
          >
            Predict 6 Hours
          </button>

        </div>

        {loadingPredictions && (
          <div className="loading-predictions">
            <p>Running AI Prediction Model...</p>
          </div>
        )}

        {predictions?.predictions && (
          <div className="prediction-cards">

            {predictions.predictions.map((pred, index) => (
              <div
                key={index}
                className="prediction-card"
              >

                <h4>
                  +{pred.hour} Hour
                  {pred.hour > 1 ? "s" : ""}
                </h4>

                <p>
                  Density:
                  {" "}
                  {pred.predicted_density?.toFixed(1)}%
                </p>

                <p>
                  Confidence:
                  {" "}
                  {(pred.confidence * 100).toFixed(0)}%
                </p>

              </div>
            ))}

          </div>
        )}

      </div>

      <div className="insights-section">

        <h3>🚦 AI Insights</h3>

        <div className="insights-grid">

          <div className="insight-card">
            <h4>Signal Optimization Active</h4>
            <p>
              AI reduced average waiting time by 18%.
            </p>
          </div>

          <div className="insight-card">
            <h4>Peak Hour Alert</h4>
            <p>
              Heavy traffic expected near Railway Junction.
            </p>
          </div>

          <div className="insight-card">
            <h4>Emergency Route Efficiency</h4>
            <p>
              Emergency corridor response improved significantly.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Analytics;