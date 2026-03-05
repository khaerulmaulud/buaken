import axios from "axios";
import { env } from "@/env";

export const api = axios.create({
  baseURL: env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For handling cookies if needed (e.g. refresh tokens)
});

api.interceptors.request.use(
  (config) => {
    // You can add auth token here if using local storage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors
    if (error.response?.status === 401) {
      // Just clean up the token, don't redirect
      // Let individual pages/components handle auth requirements
      if (typeof window !== "undefined") {
        // Only remove token if it exists and is actually invalid
        const token = localStorage.getItem("token");
        if (token) {
          localStorage.removeItem("token");
        }
      }
    }
    return Promise.reject(error);
  },
);
