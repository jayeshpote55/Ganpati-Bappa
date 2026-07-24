import axios from "axios";

let rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Clean trailing slashes
rawApiUrl = rawApiUrl.replace(/\/+$/, "");
// If it doesn't end with /api, append it
const API_BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bappa_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("bappa_token");
      localStorage.removeItem("bappa_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
