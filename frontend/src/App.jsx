import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import "./App.css";

import Dashboard from "./components/Dashboard";
import TrafficMap from "./components/TrafficMap";
import SignalControl from "./components/SignalControl";
import Analytics from "./components/Analytics";
import EmergencyManagement from "./components/EmergencyManagement";
import IncidentReports from "./components/IncidentReports";
import LiveMonitoring from "./components/LiveMonitoring";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    checkBackendConnection();

    const socket = new WebSocket(
      "ws://127.0.0.1:8000/ws/live-updates"
    );

    socket.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("WebSocket Parse Error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("WebSocket Closed");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/health"
      );

      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Backend Connection Error:", error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.type === "emergency_alert") {
      addNotification(
        "emergency",
        `Emergency vehicle detected`
      );
    }

    if (data.type === "incident_alert") {
      addNotification(
        "incident",
        `New traffic incident reported`
      );
    }
  };

  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
    };

    setNotifications((prev) => [
      newNotification,
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <Router>
      <div className="app-container">
        <header className="top-header">
          <div className="logo-section">
            <h1>🚦 UrbanFlowAI</h1>
            <p>Smart Traffic Intelligence Platform</p>
          </div>

          <div
            className={`connection-status ${
              isConnected ? "online" : "offline"
            }`}
          >
            <span className="status-dot"></span>

            {isConnected
              ? "System Online"
              : "System Offline"}
          </div>
        </header>

        <div className="layout-container">
          <nav className="sidebar">
            <Link to="/" className="nav-link">
              📊 Dashboard
            </Link>

            <Link to="/live" className="nav-link">
              📹 Live Monitoring
            </Link>

            <Link to="/map" className="nav-link">
              🗺️ Traffic Map
            </Link>

            <Link to="/signals" className="nav-link">
              🚦 Signal Control
            </Link>

            <Link to="/emergency" className="nav-link">
              🚑 Emergency
            </Link>

            <Link to="/incidents" className="nav-link">
              ⚠️ Incidents
            </Link>

            <Link to="/analytics" className="nav-link">
              📈 Analytics
            </Link>
          </nav>

          <main className="main-content">
            <Routes>
              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/live"
                element={<LiveMonitoring />}
              />

              <Route
                path="/map"
                element={<TrafficMap />}
              />

              <Route
                path="/signals"
                element={<SignalControl />}
              />

              <Route
                path="/emergency"
                element={<EmergencyManagement />}
              />

              <Route
                path="/incidents"
                element={<IncidentReports />}
              />

              <Route
                path="/analytics"
                element={<Analytics />}
              />
            </Routes>
          </main>

          {notifications.length > 0 && (
            <div className="notification-panel">
              <h3>Live Alerts</h3>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${notification.type}`}
                >
                  <div className="notification-icon">
                    {notification.type === "emergency"
                      ? "🚨"
                      : "⚠️"}
                  </div>

                  <div className="notification-content">
                    <p>{notification.message}</p>

                    <span>
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;