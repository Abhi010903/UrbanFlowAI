import React, { useState, useEffect } from "react";
import "./IncidentReports.css";

const IncidentReports = () => {

  const [incidents, setIncidents] = useState([]);

  const [showReportForm, setShowReportForm] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    junctionId: "",
    type: "accident",
    severity: "medium",
    description: "",
    lat: "",
    lng: "",
  });

  const [filterType, setFilterType] =
    useState("all");

  const [filterSeverity, setFilterSeverity] =
    useState("all");

  useEffect(() => {
    loadMockIncidents();
  }, []);

  const loadMockIncidents = () => {

    setIncidents([
      {
        id: 1,

        junction_id: "J001",

        junction_name: "Vadodara Circle",

        type: "accident",

        severity: "high",

        description:
          "Two-vehicle collision blocking left lane",

        location: {
          lat: 23.0225,
          lng: 72.5714,
        },

        reported_at: new Date(
          Date.now() - 1800000
        ).toISOString(),

        status: "active",
      },

      {
        id: 2,

        junction_id: "J003",

        junction_name: "University Road",

        type: "breakdown",

        severity: "medium",

        description:
          "Truck breakdown in center lane",

        location: {
          lat: 23.0145,
          lng: 72.564,
        },

        reported_at: new Date(
          Date.now() - 3600000
        ).toISOString(),

        status: "resolving",
      },

      {
        id: 3,

        junction_id: "J005",

        junction_name: "Sayajigunj",

        type: "roadwork",

        severity: "low",

        description:
          "Scheduled maintenance on east lane",

        location: {
          lat: 23.018,
          lng: 72.558,
        },

        reported_at: new Date(
          Date.now() - 7200000
        ).toISOString(),

        status: "resolved",
      },
    ]);
  };

  const handleSubmitReport = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const payload = {
        junction_id: formData.junctionId,

        type: formData.type,

        severity: formData.severity,

        description: formData.description,

        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
      };

      const response = await fetch(
        "http://localhost:8000/api/incidents/report",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data?.status === "success") {

        const newIncident = {
          id: data.incident_id || Date.now(),

          junction_id: formData.junctionId,

          junction_name: formData.junctionId,

          type: formData.type,

          severity: formData.severity,

          description: formData.description,

          location: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
          },

          reported_at: new Date().toISOString(),

          status: "active",
        };

        setIncidents((prev) => [
          newIncident,
          ...prev,
        ]);

        alert("Incident reported successfully");

        setShowReportForm(false);

        setFormData({
          junctionId: "",
          type: "accident",
          severity: "medium",
          description: "",
          lat: "",
          lng: "",
        });
      }

    } catch (error) {

      console.error(
        "Incident report failed:",
        error
      );

      alert("Failed to report incident");

    } finally {

      setLoading(false);

    }
  };

  const updateIncidentStatus = (
    id,
    newStatus
  ) => {

    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === id
          ? {
              ...incident,
              status: newStatus,
            }
          : incident
      )
    );
  };

  const getIncidentIcon = (type) => {

    switch (type) {

      case "accident":
        return "🚗💥";

      case "breakdown":
        return "🔧";

      case "roadwork":
        return "🚧";

      default:
        return "⚠️";
    }
  };

  const getSeverityColor = (severity) => {

    switch (severity) {

      case "critical":
        return "#dc2626";

      case "high":
        return "#ef4444";

      case "medium":
        return "#f59e0b";

      case "low":
        return "#10b981";

      default:
        return "#6b7280";
    }
  };

  const getStatusBadge = (status) => {

    switch (status) {

      case "active":
        return {
          text: "ACTIVE",
          class: "status-active",
        };

      case "resolving":
        return {
          text: "RESOLVING",
          class: "status-resolving",
        };

      case "resolved":
        return {
          text: "RESOLVED",
          class: "status-resolved",
        };

      default:
        return {
          text: status.toUpperCase(),
          class: "",
        };
    }
  };

  const getTimeSince = (timestamp) => {

    const diff =
      Date.now() -
      new Date(timestamp).getTime();

    const hours = Math.floor(
      diff / 3600000
    );

    const minutes = Math.floor(
      (diff % 3600000) / 60000
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }

    return `${minutes}m ago`;
  };

  const filteredIncidents = incidents.filter(
    (incident) => {

      if (
        filterType !== "all" &&
        incident.type !== filterType
      ) {
        return false;
      }

      if (
        filterSeverity !== "all" &&
        incident.severity !== filterSeverity
      ) {
        return false;
      }

      return true;
    }
  );

  return (
    <div className="incident-reports">

      <div className="incidents-header">

        <h2>
          🚨 Traffic Incident Reports
        </h2>

        <button
          className="btn-report-incident"

          onClick={() =>
            setShowReportForm(true)
          }
        >
          + Report New Incident
        </button>

      </div>

      <div className="incident-stats">

        <div className="stat-card">

          <span className="stat-icon">
            🚨
          </span>

          <div>
            <h3>
              {
                incidents.filter(
                  (i) => i.status === "active"
                ).length
              }
            </h3>

            <p>Active Incidents</p>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            ⏳
          </span>

          <div>
            <h3>
              {
                incidents.filter(
                  (i) =>
                    i.status === "resolving"
                ).length
              }
            </h3>

            <p>Resolving</p>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            ✅
          </span>

          <div>
            <h3>
              {
                incidents.filter(
                  (i) =>
                    i.status === "resolved"
                ).length
              }
            </h3>

            <p>Resolved Today</p>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            ⏱️
          </span>

          <div>
            <h3>18 min</h3>

            <p>Avg Response Time</p>
          </div>

        </div>

      </div>

      <div className="incident-filters">

        <div className="filter-group">

          <label>Type</label>

          <select
            value={filterType}

            onChange={(e) =>
              setFilterType(
                e.target.value
              )
            }
          >
            <option value="all">
              All Types
            </option>

            <option value="accident">
              Accidents
            </option>

            <option value="breakdown">
              Breakdowns
            </option>

            <option value="roadwork">
              Roadwork
            </option>

            <option value="other">
              Other
            </option>

          </select>

        </div>

        <div className="filter-group">

          <label>Severity</label>

          <select
            value={filterSeverity}

            onChange={(e) =>
              setFilterSeverity(
                e.target.value
              )
            }
          >
            <option value="all">
              All Severities
            </option>

            <option value="critical">
              Critical
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>

          </select>

        </div>

      </div>

      <div className="incidents-list">

        {filteredIncidents.map(
          (incident) => (

            <div
              key={incident.id}
              className="incident-card"
            >

              <div className="incident-header">

                <div className="incident-title">

                  <span className="incident-icon">
                    {getIncidentIcon(
                      incident.type
                    )}
                  </span>

                  <div>

                    <h3>
                      {
                        incident.junction_name
                      }
                    </h3>

                    <span className="incident-id">
                      #
                      {incident.id}
                      {" - "}
                      {
                        incident.junction_id
                      }
                    </span>

                  </div>

                </div>

                <span
                  className={`status-badge ${
                    getStatusBadge(
                      incident.status
                    ).class
                  }`}
                >
                  {
                    getStatusBadge(
                      incident.status
                    ).text
                  }
                </span>

              </div>

              <div className="incident-body">

                <div className="incident-info">

                  <div className="info-row">

                    <span className="info-label">
                      Type:
                    </span>

                    <span className="info-value">
                      {incident.type.toUpperCase()}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Severity:
                    </span>

                    <span
                      className="severity-badge"

                      style={{
                        backgroundColor:
                          getSeverityColor(
                            incident.severity
                          ),
                      }}
                    >
                      {incident.severity.toUpperCase()}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Reported:
                    </span>

                    <span className="info-value">
                      {getTimeSince(
                        incident.reported_at
                      )}
                    </span>

                  </div>

                </div>

                <div className="incident-description">

                  <p>
                    {incident.description}
                  </p>

                </div>

                <div className="incident-location">

                  <span className="location-icon">
                    📍
                  </span>

                  <span>
                    {
                      incident.location?.lat
                        ?.toFixed(4)
                    }
                    ,
                    {" "}
                    {
                      incident.location?.lng
                        ?.toFixed(4)
                    }
                  </span>

                </div>

              </div>

              <div className="incident-actions">

                {incident.status ===
                  "active" && (
                  <>
                    <button
                      className="btn-action primary"

                      onClick={() =>
                        updateIncidentStatus(
                          incident.id,
                          "resolving"
                        )
                      }
                    >
                      Mark Resolving
                    </button>

                    <button className="btn-action">
                      View on Map
                    </button>
                  </>
                )}

                {incident.status ===
                  "resolving" && (
                  <>
                    <button
                      className="btn-action success"

                      onClick={() =>
                        updateIncidentStatus(
                          incident.id,
                          "resolved"
                        )
                      }
                    >
                      Mark Resolved
                    </button>

                    <button className="btn-action">
                      View on Map
                    </button>
                  </>
                )}

                {incident.status ===
                  "resolved" && (
                  <button className="btn-action">
                    View Details
                  </button>
                )}

              </div>

            </div>
          )
        )}

      </div>

      {showReportForm && (

        <div
          className="modal-overlay"

          onClick={() =>
            setShowReportForm(false)
          }
        >

          <div
            className="modal-content"

            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Report New Incident
              </h3>

              <button
                className="modal-close"

                onClick={() =>
                  setShowReportForm(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmitReport}
              className="incident-form"
            >

              <div className="form-group">

                <label>
                  Junction ID
                </label>

                <input
                  type="text"

                  required

                  placeholder="e.g. J001"

                  value={formData.junctionId}

                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      junctionId:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Incident Type
                  </label>

                  <select
                    value={formData.type}

                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="accident">
                      Accident
                    </option>

                    <option value="breakdown">
                      Vehicle Breakdown
                    </option>

                    <option value="roadwork">
                      Roadwork
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Severity
                  </label>

                  <select
                    value={
                      formData.severity
                    }

                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        severity:
                          e.target.value,
                      })
                    }
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="critical">
                      Critical
                    </option>

                  </select>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  rows="4"

                  required

                  placeholder="Describe the incident"

                  value={
                    formData.description
                  }

                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"

                    required

                    step="0.000001"

                    value={formData.lat}

                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lat: e.target.value,
                      })
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"

                    required

                    step="0.000001"

                    value={formData.lng}

                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lng: e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"

                  className="btn-cancel"

                  onClick={() =>
                    setShowReportForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"

                  disabled={loading}

                  className="btn-submit"
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Report"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default IncidentReports;