import React, { useState, useRef, useEffect } from "react";
import "./LiveMonitoring.css";

const LiveMonitoring = () => {

  const [videoFile, setVideoFile] =
    useState(null);

  const [videoURL, setVideoURL] =
    useState("");

  const [analyzing, setAnalyzing] =
    useState(false);

  const [analysisResults, setAnalysisResults] =
    useState(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const videoRef = useRef(null);

  const fileInputRef = useRef(null);

  useEffect(() => {

    return () => {
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };

  }, [videoURL]);

  const handleFileSelect = (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file");
      return;
    }

    setVideoFile(file);

    setAnalysisResults(null);

    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }

    const generatedURL =
      URL.createObjectURL(file);

    setVideoURL(generatedURL);

    if (videoRef.current) {
      videoRef.current.src = generatedURL;
    }
  };

  const handleUploadAndAnalyze =
    async () => {

      if (!videoFile) {
        alert(
          "Please select a video file first"
        );
        return;
      }

      setAnalyzing(true);

      setUploadProgress(0);

      try {

        const formData = new FormData();

        formData.append("file", videoFile);

        const progressInterval =
          setInterval(() => {

            setUploadProgress((prev) =>
              Math.min(prev + 10, 90)
            );

          }, 200);

        const response = await fetch(
          "http://localhost:8000/api/traffic/upload-video",
          {
            method: "POST",
            body: formData,
          }
        );

        clearInterval(progressInterval);

        setUploadProgress(100);

        const data =
          await response.json();

        if (data?.success) {

          setAnalysisResults(
            data.analysis
          );

        } else {

          alert("Analysis failed");

        }

      } catch (error) {

        console.error(
          "Video analysis error:",
          error
        );

        alert(
          "Failed to analyze video"
        );

      } finally {

        setAnalyzing(false);

        setTimeout(() => {
          setUploadProgress(0);
        }, 1200);

      }
    };

  const getDensityLevel = (
    density
  ) => {

    if (density < 30) {
      return {
        level: "Low",
        color: "#10b981",
      };
    }

    if (density < 60) {
      return {
        level: "Medium",
        color: "#f59e0b",
      };
    }

    return {
      level: "High",
      color: "#ef4444",
    };
  };

  const densityValue =

  analysisResults?.congestion_level === "HIGH"
    ? 85

    : analysisResults?.congestion_level === "MEDIUM"
    ? 55

    : 25;

const densityInfo =
  getDensityLevel(
    densityValue
  );
  return (
    <div className="live-monitoring">

      <div className="monitoring-header">

        <h2>
          📹 Live Traffic Video Analysis
        </h2>

        <p className="subtitle">
          Upload traffic footage for
          AI-powered vehicle detection
          and density analysis
        </p>

      </div>

      <div className="upload-section">

        <div className="upload-card">

          <div className="upload-icon">
            📹
          </div>

          <h3>
            Upload Traffic Video
          </h3>

          <p>
            Analyze CCTV footage using
            YOLOv8 AI vehicle detection
          </p>

          <input
            ref={fileInputRef}

            type="file"

            accept="video/*"

            onChange={handleFileSelect}

            style={{
              display: "none",
            }}
          />

          <button
            className="btn-select-file"

            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            Choose Video File
          </button>

          {videoFile && (

            <div className="file-info">

              <span className="file-name">
                📄 {videoFile.name}
              </span>

              <span className="file-size">
                {(
                  videoFile.size /
                  (1024 * 1024)
                ).toFixed(2)}
                {" "}
                MB
              </span>

            </div>
          )}

          {uploadProgress > 0 && (

            <div className="progress-bar">

              <div
                className="progress-fill"

                style={{
                  width:
                    `${uploadProgress}%`,
                }}
              >
                {uploadProgress}%
              </div>

            </div>
          )}

          <button
            className="btn-analyze"

            onClick={
              handleUploadAndAnalyze
            }

            disabled={
              !videoFile || analyzing
            }
          >
            {analyzing
              ? "🔄 Analyzing..."
              : "🚀 Upload & Analyze"}
          </button>

        </div>

        {videoFile && (

          <div className="video-preview">

            <h4>
              Video Preview
            </h4>

            <video
              ref={videoRef}

              controls

              className="preview-video"
            />

          </div>
        )}

      </div>

      {analysisResults && (

        <div className="analysis-results">

          <h3>
            Analysis Results
          </h3>

          <div className="results-summary">

            <div className="summary-card">

              <div className="card-icon">
                🎬
              </div>

              <div className="card-content">

                <h4>
                  {analysisResults.frames_processed
  ?.toLocaleString() || 0}
                </h4>

                <p>
                  Frames Analyzed
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                🚗
              </div>

              <div className="card-content">

                <h4>
                  {analysisResults.total_vehicles
                    ?.toLocaleString() || 0}
                </h4>

                <p>
                  Vehicles Detected
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                📊
              </div>

              <div className="card-content">

                <h4>
                  {densityValue}%
                </h4>

                <p>
                  Average Density
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                {densityInfo.level ===
                "Low"
                  ? "🟢"
                  : densityInfo.level ===
                    "Medium"
                  ? "🟡"
                  : "🔴"}
              </div>

              <div className="card-content">

                <h4>
                  {densityInfo.level}
                </h4>

                <p>
                  Traffic Level
                </p>

              </div>

            </div>

          </div>

          <div className="vehicle-breakdown">

            <h4>
              Vehicle Type Distribution
            </h4>

            <div className="breakdown-grid">

              <div className="breakdown-item">

                <span className="vehicle-icon">
                  🚗
                </span>

                <div>

                  <p className="vehicle-count">
                    {analysisResults
                      .vehicle_breakdown
                      ?.cars || 0}
                  </p>

                  <p className="vehicle-label">
                    Cars
                  </p>

                </div>

              </div>

              <div className="breakdown-item">

                <span className="vehicle-icon">
                  🏍️
                </span>

                <div>

                  <p className="vehicle-count">
                    {analysisResults
                      .vehicle_breakdown
                      ?.bikes || 0}
                  </p>

                  <p className="vehicle-label">
                    Bikes
                  </p>

                </div>

              </div>

              <div className="breakdown-item">

                <span className="vehicle-icon">
                  🚌
                </span>

                <div>

                  <p className="vehicle-count">
                    {analysisResults
                      .vehicle_breakdown
                      ?.buses || 0}
                  </p>

                  <p className="vehicle-label">
                    Buses
                  </p>

                </div>

              </div>

              <div className="breakdown-item">

                <span className="vehicle-icon">
                  🚛
                </span>

                <div>

                  <p className="vehicle-count">
                    {analysisResults
                      .vehicle_breakdown
                      ?.trucks || 0}
                  </p>

                  <p className="vehicle-label">
                    Trucks
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="visual-breakdown">

            <h4>
              Traffic Composition
            </h4>

            <div className="bar-chart">

              {Object.entries(
                analysisResults
                  ?.vehicle_breakdown || {}
              ).map(([type, count]) => {

                const total =
                  analysisResults
                    ?.total_vehicles || 1;

                const percentage =
                  (count / total) * 100;

                return (

                  <div
                    key={type}
                    className="bar-item"
                  >

                    <div className="bar-label">
                      {type}
                    </div>

                    <div className="bar-container">

                      <div
                        className="bar-fill"

                        style={{
                          width:
                            `${percentage}%`,

                          backgroundColor:
                            type === "cars"
                              ? "#3b82f6"
                              : type ===
                                "bikes"
                              ? "#10b981"
                              : type ===
                                "buses"
                              ? "#f59e0b"
                              : "#8b5cf6",
                        }}
                      >
                        {count}
                      </div>

                    </div>

                    <div className="bar-percentage">
                      {percentage.toFixed(1)}
                      %
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          <div className="processing-info">

            <p>
              <strong>
                Processing Time:
              </strong>
              {" "}
              {new Date().toLocaleTimeString()}
            </p>

            <p>
              <strong>
                AI Model:
              </strong>
              {" "}
              YOLOv8 Real-time Object
              Detection
            </p>

            <p>
              <strong>
                Detection Confidence:
              </strong>
              {" "}
              85-95%
            </p>

          </div>

        </div>
      )}

      <div className="how-it-works">

        <h3>
          How It Works
        </h3>

        <div className="steps-grid">

          <div className="step">

            <div className="step-number">
              1
            </div>

            <h4>
              Upload Video
            </h4>

            <p>
              Select CCTV or traffic
              footage
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              2
            </div>

            <h4>
              AI Detection
            </h4>

            <p>
              YOLOv8 detects vehicles
              frame-by-frame
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              3
            </div>

            <h4>
              Classification
            </h4>

            <p>
              Vehicles classified into
              cars, buses, trucks,
              bikes
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              4
            </div>

            <h4>
              Smart Analysis
            </h4>

            <p>
              Density and congestion
              metrics generated
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default LiveMonitoring;