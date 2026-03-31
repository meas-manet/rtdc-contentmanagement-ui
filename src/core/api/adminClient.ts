import axios from "axios";

// Use relative URL — Vite dev proxy forwards /api to localhost:5062
const BASE_URL = "";

// Admin client — attaches Bearer JWT for all website/schema/media routes
export const adminClient = axios.create({ baseURL: BASE_URL });

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("jwt");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);
