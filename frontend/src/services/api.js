const API_BASE_URL = "http://127.0.0.1:8000";

const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  async uploadFile(endpoint, file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API Upload Error:", error);
      throw error;
    }
  },
};

export const trafficAPI = {
  getLiveTraffic: () => apiClient.get("/api/traffic/live"),
  getLiveData: () => apiClient.get("/api/traffic/live-data"),
  uploadVideo: (file) =>
    apiClient.uploadFile("/api/traffic/upload-video", file),
};

export const analyticsAPI = {
  getStatistics: () =>
    apiClient.get("/api/analytics/statistics"),
  getHeatmap: () => apiClient.get("/api/analytics/heatmap"),
  getPredictions: () =>
    apiClient.get("/api/analytics/predictions"),
};

export const signalsAPI = {
  getStatus: () => apiClient.get("/api/signals/status"),
  optimize: (junctionId) =>
    apiClient.post("/api/signals/optimize", {
      junction_id: junctionId,
    }),
};

export const incidentsAPI = {
  report: (incident) =>
    apiClient.post("/api/incidents/report", incident),
};

export const healthAPI = {
  check: () => apiClient.get("/health"),
};

export default apiClient;
