import React, { useState, useEffect } from "react";
import "./EmergencyManagement.css";

const EmergencyManagement = () => {

  const [activeCorridors, setActiveCorridors] = useState([]);

  const [loading, setLoading] = useState(false);

  const [emergencyForm, setEmergencyForm] = useState({
    vehicleType: "ambulance",
    startLat: "",
    startLng: "",
    destLat: "",
    destLng: "",
    priority: 1,
  });

  const [emergencyHistory, setEmergencyHistory] = useState([]);

  useEffect(() => {
    initializeEmergencyData();
  }, []);

  const initializeEmergencyData = () => {
    setActiveCorridors([
      {
        corridor_id: "CORRIDOR_20260520143052",

        vehicle_type: "ambulance",

        route: {
          start: "J001",
          destination: "J008",

          path: [
            "J001",
            "J002",
            "J003",
            "J004",
            "J008",
          ],

          estimated_time_seconds: 420,
        },

        activated_at: new Date(
          Date.now() - 180000
        ).toISOString(),

        status: "active",
      },
    ]);

    setEmergencyHistory([
      {
        id: 1,
        type: "ambulance",
        route: "Vadodara Circle → Akota Junction",
        duration: "7 min",
        completed_at: "14:25",
        saved_time: "3 min",
      },

      {
        id: 2,
        type: "fire_truck",
        route: "Railway Station → University Road",
        duration: "5 min",
        completed_at: "13:48",
        saved_time: "4 min",
      },
    ]);
  };

  const handleCreateCorridor = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/emergency/detect",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            type: emergencyForm.vehicleType,

            location: {
              lat: parseFloat(emergencyForm.startLat),
              lng: parseFloat(emergencyForm.startLng),
            },

            destination: {
              lat: parseFloat(emergencyForm.destLat),
              lng: parseFloat(emergencyForm.destLng),
            },

            priority: emergencyForm.priority,

            has_sirens: true,
          }),
        }
      );

      const data = await response.json();

      if (
        data?.status === "success" &&
        data?.emergency_detected
      ) {
        alert("Green Corridor Activated Successfully");

        setEmergencyForm({
          vehicleType: "ambulance",
          startLat: "",
          startLng: "",
          destLat: "",
          destLng: "",
          priority: 1,
        });

        if (data?.corridor) {
          setActiveCorridors((prev) => [
            ...prev,
            data.corridor,
          ]);
        }
      }
    } catch (error) {
      console.error("Corridor creation failed:", error);

      alert("Failed to create green corridor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = (corridorId) => {
    setActiveCorridors((prev) =>
      prev.filter(
        (corridor) =>
          corridor.corridor_id !== corridorId
      )
    );
  };

  const getTimeSince = (timestamp) => {
    const diff =
      Date.now() - new Date(timestamp).getTime();

    const minutes = Math.floor(diff / 60000);

    return `${minutes} min ago`;
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "ambulance":
        return "🚑";

      case "fire_truck":
        return "🚒";

      case "police":
        return "🚓";

      default:
        return "🚨";
    }
  };

  return (
    <div className="emergency-management">

      <div className="emergency-header">

        <h2>🚨 Emergency Vehicle Management</h2>

        <div className="emergency-stats">

          <div className="stat-box">
            <span className="stat-value">
              {activeCorridors.length}
            </span>

            <span className="stat-label">
              Active Corridors
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-value">
              {emergencyHistory.length}
            </span>

            <span className="stat-label">
              Today's Responses
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-value">
              3.5 min
            </span>

            <span className="stat-label">
              Avg Time Saved
            </span>
          </div>

        </div>

      </div>

      <div className="create-corridor-section">

        <h3>Create Green Corridor</h3>

        <form
          onSubmit={handleCreateCorridor}
          className="corridor-form"
        >

          <div className="form-row">

            <div className="form-group">

              <label>Vehicle Type</label>

              <select
                value={emergencyForm.vehicleType}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    vehicleType: e.target.value,
                  })
                }
              >
                <option value="ambulance">
                  🚑 Ambulance
                </option>

                <option value="fire_truck">
                  🚒 Fire Truck
                </option>

                <option value="police">
                  🚓 Police
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>Priority Level</label>

              <select
                value={emergencyForm.priority}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    priority: parseInt(e.target.value),
                  })
                }
              >
                <option value="1">
                  🔴 Critical
                </option>

                <option value="2">
                  🟠 High
                </option>

                <option value="3">
                  🟡 Medium
                </option>

              </select>

            </div>

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>Start Latitude</label>

              <input
                type="number"
                step="0.000001"
                required
                value={emergencyForm.startLat}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    startLat: e.target.value,
                  })
                }
              />

            </div>

            <div className="form-group">

              <label>Start Longitude</label>

              <input
                type="number"
                step="0.000001"
                required
                value={emergencyForm.startLng}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    startLng: e.target.value,
                  })
                }
              />

            </div>

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>Destination Latitude</label>

              <input
                type="number"
                step="0.000001"
                required
                value={emergencyForm.destLat}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    destLat: e.target.value,
                  })
                }
              />

            </div>

            <div className="form-group">

              <label>Destination Longitude</label>

              <input
                type="number"
                step="0.000001"
                required
                value={emergencyForm.destLng}

                onChange={(e) =>
                  setEmergencyForm({
                    ...emergencyForm,
                    destLng: e.target.value,
                  })
                }
              />

            </div>

          </div>

          <button
            type="submit"
            className="btn-create-corridor"
            disabled={loading}
          >
            {loading
              ? "Activating..."
              : "🚦 Activate Green Corridor"}
          </button>

        </form>

      </div>

      <div className="active-corridors-section">

        <h3>Active Corridors</h3>

        {activeCorridors.length === 0 ? (
          <div className="no-corridors">
            <p>No active corridors currently.</p>
          </div>
        ) : (
          <div className="corridors-list">

            {activeCorridors.map((corridor) => (

              <div
                key={corridor.corridor_id}
                className="corridor-card active"
              >

                <div className="corridor-header">

                  <div className="vehicle-info">

                    <span className="vehicle-icon">
                      {getVehicleIcon(
                        corridor.vehicle_type
                      )}
                    </span>

                    <div>

                      <h4>
                        {corridor.vehicle_type
                          ?.replace("_", " ")
                          .toUpperCase()}
                      </h4>

                      <p className="corridor-id">
                        {corridor.corridor_id}
                      </p>

                    </div>

                  </div>

                  <span className="status-badge active">
                    ACTIVE
                  </span>

                </div>

                <div className="corridor-route">

                  <div className="route-path">

                    <span className="route-point start">
                      {corridor.route?.start}
                    </span>

                    <div className="route-arrow">

                      {corridor.route?.path
                        ?.slice(1, -1)
                        ?.map((point, idx) => (
                          <span
                            key={idx}
                            className="route-via"
                          >
                            {point}
                          </span>
                        ))}

                    </div>

                    <span className="route-point end">
                      {corridor.route?.destination}
                    </span>

                  </div>

                </div>

                <div className="corridor-metrics">

                  <div className="metric">

                    <p className="metric-label">
                      Estimated Time
                    </p>

                    <p className="metric-value">
                      {Math.floor(
                        corridor.route
                          ?.estimated_time_seconds / 60
                      )}{" "}
                      min
                    </p>

                  </div>

                  <div className="metric">

                    <p className="metric-label">
                      Signals Synced
                    </p>

                    <p className="metric-value">
                      {corridor.route?.path?.length * 2}
                    </p>

                  </div>

                  <div className="metric">

                    <p className="metric-label">
                      Active Since
                    </p>

                    <p className="metric-value">
                      {getTimeSince(
                        corridor.activated_at
                      )}
                    </p>

                  </div>

                </div>

                <button
                  className="btn-deactivate"

                  onClick={() =>
                    handleDeactivate(
                      corridor.corridor_id
                    )
                  }
                >
                  Deactivate Corridor
                </button>

              </div>
            ))}

          </div>
        )}

      </div>

      <div className="history-section">

        <h3>Recent Emergency Responses</h3>

        <div className="history-table">

          <table>

            <thead>

              <tr>
                <th>Type</th>
                <th>Route</th>
                <th>Duration</th>
                <th>Time Saved</th>
                <th>Completed</th>
              </tr>

            </thead>

            <tbody>

              {emergencyHistory.map((item) => (

                <tr key={item.id}>

                  <td>
                    {getVehicleIcon(item.type)}{" "}
                    {item.type.replace("_", " ")}
                  </td>

                  <td>{item.route}</td>

                  <td>{item.duration}</td>

                  <td className="time-saved">
                    +{item.saved_time}
                  </td>

                  <td>{item.completed_at}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default EmergencyManagement;