import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiUpload, FiPlay, FiX, FiCpu, FiActivity, FiAlertTriangle } from "react-icons/fi";
import "./LiveMonitoring.css";
import { trafficAPI } from "../services/api";

const statusColor = (s) => ({ CRITICAL:"#ef4444", HIGH:"#f59e0b", MODERATE:"#06b6d4" }[s] || "#10b981");

export default function LiveMonitoring() {
  const [videoFile, setVideoFile]   = useState(null);
  const [videoURL,  setVideoURL]    = useState("");
  const [analyzing, setAnalyzing]   = useState(false);
  const [progress,  setProgress]    = useState(0);
  const [analysis,  setAnalysis]    = useState(null);
  const [liveState, setLiveState]   = useState(null);
  const [dragOver,  setDragOver]    = useState(false);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  // Poll live state every 4 s
  useEffect(() => {
    const poll = async () => {
      try { const r = await trafficAPI.getLiveData(); if (r.success) setLiveState(r.data); } catch {}
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => { clearInterval(iv); if (videoURL) URL.revokeObjectURL(videoURL); };
  }, []);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("video/")) return;
    if (videoURL) URL.revokeObjectURL(videoURL);
    setVideoFile(file);
    setVideoURL(URL.createObjectURL(file));
    setAnalysis(null);
    setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setAnalyzing(true); setProgress(0);
    timerRef.current = setInterval(() => setProgress(p => Math.min(p + Math.random() * 18, 92)), 250);
    try {
      const r = await trafficAPI.uploadVideo(videoFile);
      clearInterval(timerRef.current);
      setProgress(100);
      if (r.success) {
        setAnalysis(r.analysis);
        setLiveState(r.traffic_state);
      }
    } catch (e) {
      clearInterval(timerRef.current);
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    clearInterval(timerRef.current);
    if (videoURL) URL.revokeObjectURL(videoURL);
    setVideoFile(null); setVideoURL(""); setAnalysis(null); setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const congColor = (c) => ({ HIGH:"#ef4444", MEDIUM:"#f59e0b", LOW:"#10b981" }[c] || "#10b981");

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div>
          <h1 className="page-title">Live Monitoring</h1>
          <p className="page-sub">Upload traffic footage — AI analysis drives all panels in real-time</p>
        </div>
        {liveState?.source === "video_analysis" && (
          <div className="source-badge"><span className="live-dot" />Powered by Video Analysis</div>
        )}
      </div>

      {/* Live stats row — updates after upload */}
      {liveState && (
        <div className="lm-stats-row">
          {[
            { label:"Total Vehicles",    value: liveState.total_vehicles,   color:"#3b82f6" },
            { label:"Avg Density",       value: `${liveState.average_density}%`, color: statusColor(liveState.traffic_status) },
            { label:"Traffic Status",    value: liveState.traffic_status,   color: statusColor(liveState.traffic_status) },
            { label:"Avg Speed",         value: `${liveState.average_speed} km/h`, color:"#10b981" },
            { label:"Active Incidents",  value: liveState.active_incidents, color:"#f59e0b" },
            { label:"Signals Optimized", value: liveState.optimized_signals,color:"#8b5cf6" },
          ].map((s,i) => (
            <div key={i} className="lm-stat-card" style={{ borderTopColor: s.color }}>
              <div className="lm-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="lm-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="lm-body">
        {/* Upload + Analysis */}
        <div className="lm-main-card">
          <div className="lm-card-head"><FiCpu size={18} style={{color:"#3b82f6"}} /><h3>AI Video Analysis</h3></div>

          {!videoURL ? (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FiUpload size={44} className="upload-icon" />
              <p className="upload-title">Drop traffic footage here</p>
              <p className="upload-sub">MP4 · AVI · MOV · MKV — YOLOv8 vehicle detection</p>
              <input ref={fileRef} type="file" accept="video/*" onChange={e => loadFile(e.target.files?.[0])} style={{display:"none"}} />
            </div>
          ) : (
            <div className="video-section">
              <video className="video-player" controls src={videoURL} />

              {analyzing ? (
                <div className="progress-wrap">
                  <div className="progress-label">
                    <span>🤖 YOLOv8 analyzing frame-by-frame...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}} /></div>
                  <p className="progress-hint">Detecting vehicles · Classifying types · Calculating density</p>
                </div>
              ) : (
                <div className="btn-row">
                  <button className="btn-analyze" onClick={handleAnalyze}><FiPlay size={16} />Analyze with AI</button>
                  <button className="btn-clear" onClick={handleClear}><FiX size={16} />Clear</button>
                </div>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="analysis-results">
              <div className="results-header">
                <h3>Analysis Results</h3>
                <span className="conf-badge">✓ {analysis.confidence}% confidence · {analysis.analysis_time}s</span>
              </div>

              <div className="results-kpi-grid">
                {[
                  { label:"Total Vehicles",    value: analysis.total_vehicles,          color:"#3b82f6" },
                  { label:"Traffic Density",   value: `${analysis.traffic_density}%`,   color: congColor(analysis.congestion_level) },
                  { label:"Avg Speed",         value: `${analysis.average_speed} km/h`, color:"#10b981" },
                  { label:"Congestion Level",  value: analysis.congestion_level,        color: congColor(analysis.congestion_level) },
                  { label:"Frames Processed",  value: analysis.frames_processed?.toLocaleString(), color:"#8b5cf6" },
                  { label:"Incidents Found",   value: analysis.incidents_detected,      color: analysis.incidents_detected > 0 ? "#ef4444" : "#10b981" },
                ].map((r,i) => (
                  <div key={i} className="result-card" style={{borderTopColor: r.color}}>
                    <div className="result-val" style={{color: r.color}}>{r.value}</div>
                    <div className="result-lbl">{r.label}</div>
                  </div>
                ))}
              </div>

              {/* Vehicle breakdown */}
              <div className="breakdown-section">
                <h4>Vehicle Type Distribution</h4>
                <div className="breakdown-bars">
                  {Object.entries(analysis.vehicle_breakdown || {}).map(([type, count]) => {
                    const total = analysis.total_vehicles || 1;
                    const pct = Math.round((count / total) * 100);
                    const colors = { cars:"#3b82f6", bikes:"#10b981", buses:"#f59e0b", trucks:"#8b5cf6" };
                    return (
                      <div key={type} className="breakdown-row">
                        <span className="bd-label">{type.charAt(0).toUpperCase()+type.slice(1)}</span>
                        <div className="bd-track">
                          <div className="bd-fill" style={{width:`${pct}%`, background: colors[type] || "#3b82f6"}} />
                        </div>
                        <span className="bd-count">{count}</span>
                        <span className="bd-pct" style={{color: colors[type]}}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="analysis-meta">
                <span>🤖 Model: YOLOv8</span>
                <span>📅 {new Date(analysis.timestamp).toLocaleTimeString()}</span>
                <span>🎬 Peak: {analysis.peak_frame_vehicles} vehicles/frame</span>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="lm-side">
          <div className="how-it-works">
            <h3>How It Works</h3>
            {[
              { n:"01", title:"Upload Video",     desc:"Select CCTV or traffic footage" },
              { n:"02", title:"AI Detection",     desc:"YOLOv8 scans every 5th frame" },
              { n:"03", title:"Classification",   desc:"Cars, buses, trucks, bikes" },
              { n:"04", title:"State Propagation",desc:"All panels update instantly" },
            ].map((s,i) => (
              <div key={i} className="step-item">
                <div className="step-num">{s.n}</div>
                <div><p className="step-title">{s.title}</p><p className="step-desc">{s.desc}</p></div>
              </div>
            ))}
          </div>

          {liveState?.vehicle_breakdown && (
            <div className="vb-card">
              <h3>Live Vehicle Mix</h3>
              {Object.entries(liveState.vehicle_breakdown).map(([type, count]) => {
                const colors = { cars:"#3b82f6", bikes:"#10b981", buses:"#f59e0b", trucks:"#8b5cf6" };
                return (
                  <div key={type} className="vb-row">
                    <span className="vb-lbl">{type}</span>
                    <span className="vb-val" style={{color: colors[type]}}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
