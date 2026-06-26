// EN: Axios instance pre-configured with the backend base URL and an interceptor that attaches the JWT on every request.
// ES: Instancia de Axios preconfigurada con la URL base del backend y un interceptor que adjunta el JWT en cada petición.

import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1`;

// EN: Shared Axios instance used by all service calls in the frontend.
// ES: Instancia de Axios compartida utilizada por todas las llamadas de servicio del frontend.
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("el_pacto_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
