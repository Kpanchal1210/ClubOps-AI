import axios from "axios";
import { safeStorage } from "../utils/storage";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle common API errors
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      safeStorage.removeItem("token");
      safeStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default api;