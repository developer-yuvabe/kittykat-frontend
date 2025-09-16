import axios from "axios";
import { auth } from "../firebase.config";
import { AppConfig } from "../app.config";

const getClientSideToken = () => {
  return auth.currentUser?.getIdToken();
};

const axiosInstance = axios.create({
  baseURL: `${AppConfig.API_BASE_URL}/api/v1`,
});

// Request interceptor: Attach token to Authorization header
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getClientSideToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors (Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Retry logic for 401 Unauthorized errors
    if (response?.status === 401 && !config.__retry) {
      config.__retry = true; // Track retry status

      const newToken = await getClientSideToken(); // Refresh token if needed
      if (!newToken) console.log("User is not authenticated");

      if (newToken) {
        config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(config); // Retry request with new token
      }
    }

    return Promise.reject(error); // Propagate other errors
  }
);

export default axiosInstance;
