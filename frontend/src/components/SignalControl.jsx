import React, { useState, useEffect } from "react";
import "./SignalControl.css";

const SignalControl = () => {
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [optimizationLog, setOptimizationLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignalData();

    const interval = setInterval(() => {
      fetchSignalData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchSignalData = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/signals/status"
      );

      const data = await response.json();

      if (data?.status === "success" && Array.isArray(data.signals)) {
        setSignals(data.signals);
      }
    } catch (error) {
      console.error("Signal fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addOptimizationLog = (message, type) => {
    setOptimizationLog((prev) => [
      {
        id: Date.now(),
        message,
        type,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleOptimizeSignal = async (junctionId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/signals/optimize?junction_id=${junctionId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data?.status === "success") {
        addOptimizationLog(
          `Optimized junction ${junctionId}`,
          "success"
        );

        fetchSignalData();
      }
    } catch (error) {
      addOptimizationLog(
        `Optimization failed for ${junctionId}`,
        "error"
      );
    }
  };

  const handleOptimizeAll = async () => {
    try {
      for (const signal of signals) {
        await handleOptimizeSignal(signal.junction_id);
      }

      addOptimizationLog(
        "All signals optimized successfully",
        "success"
      );
    } catch (error) {
      addOptimizationLog(
        "Bulk optimization failed",
        "error"
      );
    }
  };

  const getSignalColor = (status) => {
    switch (status) {
      case "green":
        return "#10b981";

      case "yellow":
        return "#f59e0b";

      case "red":
        return "#ef4444";

      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="signal-loading">
        <h2>Loading Signal Data...</h2>
      </div>
    );
  }

  return (
    <div className="signal-control">

      <div className="signal-control-header">
        <div>
          <h1>🚦 UrbanFlowAI Signal Control</h1>
          <p>Adaptive AI Traffic Signal Optimization System</p>
        </div>

        <div className="signal-control-buttons">
          <button
            className="mode-btn"
            onClick={() => setManualMode(!manualMode)}
          >
            {manualMode ? "🤖 Auto Mode" : "👤 Manual Mode"}
          </button>

          <button
            className="optimize-all-btn"
            disabled={manualMode}
            onClick={handleOptimizeAll}
          >
            ⚡ Optimize All
          </button>
        </div>
      </div>

      <div className="signal-status-grid">

        <div className="signal-status-card">
          <h3>System Mode</h3>
          <p className={manualMode ? "manual" : "auto"}>
            {manualMode ? "MANUAL" : "AUTOMATIC"}
          </p>
        </div>

        <div className="signal-status-card">
          <h3>Total Signals</h3>
          <p>{signals.length}</p>
        </div>

        <div className="signal-status-card">
          <h3>Optimization</h3>
          <p className="signal-active">ACTIVE</p>
        </div>

        <div className="signal-status-card">
          <h3>Updated</h3>
          <p>{new Date().toLocaleTimeString()}</p>
        </div>

      </div>

      <div className="signals-grid">

        {signals.map((signal) => (
          <div
            key={signal.junction_id}
            className={`traffic-signal-card ${
              selectedSignal?.junction_id === signal.junction_id
                ? "signal-selected"
                : ""
            }`}
            onClick={() => setSelectedSignal(signal)}
          >

            <div className="signal-card-header">
              <h2>{signal.name}</h2>
              <span>{signal.junction_id}</span>
            </div>

            <div className="signal-light-section">

              <div
                className="signal-light"
                style={{
                  background: getSignalColor(signal.status),
                }}
              />

              <div>
                <h3>{signal.phase_name}</h3>
                <p>{signal.time_remaining}s remaining</p>
              </div>

            </div>

            <div className="signal-metrics">

              <div className="signal-metric-box">
                <span>Phase</span>
                <strong>
                  {signal.current_phase}/4
                </strong>
              </div>

              <div className="signal-metric-box">
                <span>Status</span>
                <strong>{signal.status}</strong>
              </div>

            </div>

            <button
              className="optimize-btn"
              disabled={manualMode}
              onClick={(e) => {
                e.stopPropagation();
                handleOptimizeSignal(signal.junction_id);
              }}
            >
              Optimize Signal
            </button>

          </div>
        ))}

      </div>

      {selectedSignal && (
        <div className="signal-details">

          <div className="signal-details-header">
            <h2>{selectedSignal.name}</h2>

            <button
              className="signal-close-btn"
              onClick={() => setSelectedSignal(null)}
            >
              ✕
            </button>
          </div>

          <div className="signal-details-grid">

            <div className="signal-details-card">
              <h3>Current Phase</h3>
              <p>{selectedSignal.phase_name}</p>
            </div>

            <div className="signal-details-card">
              <h3>Status</h3>
              <p>{selectedSignal.status}</p>
            </div>

            <div className="signal-details-card">
              <h3>Time Remaining</h3>
              <p>{selectedSignal.time_remaining}s</p>
            </div>

            <div className="signal-details-card">
              <h3>Signal ID</h3>
              <p>{selectedSignal.junction_id}</p>
            </div>

          </div>

        </div>
      )}

      <div className="optimization-log">

        <h2>Optimization Logs</h2>

        {optimizationLog.length === 0 ? (
          <p>No optimization activity yet.</p>
        ) : (
          optimizationLog.map((log) => (
            <div
              key={log.id}
              className={`log-item ${log.type}`}
            >
              <span>{log.time}</span>
              <p>{log.message}</p>
            </div>
          ))
        )}

      </div>

    </div>
  );
};

export default SignalControl;