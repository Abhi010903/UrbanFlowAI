import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiMap, FiSettings, FiTrendingUp, FiAlertTriangle, FiFileText, FiEye, FiZap } from "react-icons/fi";
import "./App.css";
import Dashboard from "./components/Dashboard";
import TrafficMap from "./components/TrafficMap";
import SignalControl from "./components/SignalControl";
import Analytics from "./components/Analytics";
import EmergencyManagement from "./components/EmergencyManagement";
import IncidentReports from "./components/IncidentReports";
import LiveMonitoring from "./components/LiveMonitoring";
import { healthAPI } from "./services/api";

const menuItems = [
  { path: "/", label: "Dashboard", icon: FiHome },
  { path: "/monitoring", label: "Live Monitoring", icon: FiEye },
  { path: "/map", label: "Traffic Map", icon: FiMap },
  { path: "/signal-control", label: "Signal Control", icon: FiSettings },
  { path: "/analytics", label: "Analytics", icon: FiTrendingUp },
  { path: "/emergency", label: "Emergency", icon: FiAlertTriangle },
  { path: "/incidents", label: "Incidents", icon: FiFileText },
];

function NavItem({ path, label, icon: Icon }) {
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <Link to={path} className={`nav-item ${active ? "active" : ""}`}>
      <span className="nav-icon"><Icon size={18} /></span>
      <span className="nav-label">{label}</span>
      {active && <span className="nav-active-bar" />}
    </Link>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/live-updates");
    socket.onopen = () => setIsConnected(true);
    socket.onmessage = (e) => {
      try { handleWsMessage(JSON.parse(e.data)); } catch {}
    };
    socket.onerror = () => setIsConnected(false);
    socket.onclose = () => setIsConnected(false);
    return () => socket.close();
  }, []);

  const checkBackendConnection = async () => {
    try { await healthAPI.check(); setIsConnected(true); }
    catch { setIsConnected(false); }
  };

  const handleWsMessage = (data) => {
    const map = {
      emergency_alert: ["emergency", "Emergency vehicle detected"],
      incident_alert: ["incident", "New traffic incident reported"],
      SIGNAL_UPDATE: ["info", `Signal optimized at ${data.junction_id}`],
    };
    if (map[data.type]) addNotification(...map[data.type]);
  };

  const addNotification = (type, message) => {
    const n = { id: Date.now(), type, message, timestamp: new Date() };
    setNotifications((prev) => [n, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 5000);
  };

  return (
    <div className={`app ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <header className="app-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          <div className="brand">
            <FiZap className="brand-icon" size={22} />
            <span className="brand-name">UrbanFlow<span className="brand-ai">AI</span></span>
          </div>
          <span className="brand-tagline">Smart City Traffic Intelligence</span>
        </div>
        <div className="header-right">
          <div className={`conn-badge ${isConnected ? "online" : "offline"}`}>
            <span className="conn-dot" />
            {isConnected ? "Live" : "Offline"}
          </div>
        </div>
      </header>

      <aside className={`app-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-logo">
          <FiZap size={28} className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-brand">UrbanFlow<span>AI</span></div>
            <div className="sidebar-sub">Traffic Intelligence</div>
          </div>
        </div>
        <nav className="nav-menu">
          {menuItems.map((item) => <NavItem key={item.path} {...item} />)}
        </nav>
        <div className="sidebar-footer">
          <div className={`sys-status ${isConnected ? "online" : "offline"}`}>
            <span className="sys-dot" />
            <span>{isConnected ? "System Online" : "System Offline"}</span>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/map" element={<TrafficMap />} />
          <Route path="/signal-control" element={<SignalControl />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/emergency" element={<EmergencyManagement />} />
          <Route path="/incidents" element={<IncidentReports />} />
        </Routes>
      </main>

      <div className="notif-stack">
        {notifications.map((n) => (
          <div key={n.id} className={`notif notif-${n.type}`}>
            <div className="notif-bar" />
            <div className="notif-body">
              <p className="notif-msg">{n.message}</p>
              <p className="notif-time">{n.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return <Router><App /></Router>;
}
