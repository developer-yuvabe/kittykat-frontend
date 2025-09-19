import axios from "axios";
import { auth } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { AppConfig } from "../app.config";

const getClientSideToken = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          resolve(token);
        } catch (error) {
          console.error("Error fetching token:", error);
          resolve(null);
        }
      } else {
        console.error("No user is signed in.");
        await fetch("/api/logout");
        window.location.href = "/login";
        resolve(null);
      }
    });
  });
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
    } else {
      console.error("No token available for request.");
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
      if (newToken) {
        config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(config); // Retry request with new token
      }
    }

    return Promise.reject(error); // Propagate other errors
  }
);

export default axiosInstance;
