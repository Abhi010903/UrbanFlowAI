import axios from "axios";

const BASE = "http://127.0.0.1:8000";
const api = axios.create({ baseURL: BASE, timeout: 30000 });

const get  = (url, p) => api.get(url, { params: p }).then(r => r.data);
const post = (url, d, cfg) => api.post(url, d, cfg).then(r => r.data);
const patch = (url, d) => api.patch(url, d).then(r => r.data);
const del  = (url) => api.delete(url).then(r => r.data);

export const healthAPI = {
  check: () => get("/health"),
};

export const trafficAPI = {
  getLiveTraffic:    () => get("/api/traffic/live"),
  getLiveData:       () => get("/api/traffic/live-data"),
  getLatestAnalysis: () => get("/api/traffic/latest-analysis"),
  uploadVideo: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return post("/api/traffic/upload-video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const signalsAPI = {
  getStatus:   () => get("/api/signals/status"),
  optimize:    (junctionId) => post(`/api/signals/optimize?junction_id=${junctionId}`),
  optimizeAll: () => post("/api/signals/optimize-all"),
};

export const analyticsAPI = {
  getStatistics:  () => get("/api/analytics/statistics"),
  getHeatmap:     () => get("/api/analytics/heatmap"),
  getPredictions: () => get("/api/analytics/predictions"),
  getJunctions:   () => get("/api/analytics/junction-stats"),
};

export const incidentsAPI = {
  getAll:        () => get("/api/incidents"),
  report:        (data) => post("/api/incidents/report", data),
  updateStatus:  (id, status) => patch(`/api/incidents/${id}/status?status=${status}`),
  delete:        (id) => del(`/api/incidents/${id}`),
};

export const emergencyAPI = {
  getCorridors:   () => get("/api/emergency/corridors"),
  createCorridor: (data) => post("/api/emergency/create-corridor", data),
  toggleCorridor: (id) => patch(`/api/emergency/corridors/${id}/toggle`),
  deleteCorridor: (id) => del(`/api/emergency/corridors/${id}`),
};
