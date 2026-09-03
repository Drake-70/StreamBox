import axios from "axios";

// In production, point at the deployed backend (VITE_API_URL), e.g.
// "https://streambox-api.onrender.com/api". In dev this falls back to the
// relative "/api" path which the Vite dev server proxies to localhost:5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

export default api;
