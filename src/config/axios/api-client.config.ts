import axios from "axios";
import { env } from "../env";
import { auth } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";

const getClientSideToken = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (user) {
        try {
          const token = await user.getIdToken(true);
          resolve(token);
        } catch (error) {
          console.error("Error fetching token:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

const baseURLs = {
  prod: env.NEXT_PUBLIC_API_BASE_URL_PROD,
  stg: env.NEXT_PUBLIC_API_BASE_URL_STG,
  dev: env.NEXT_PUBLIC_API_BASE_URL_DEV,
};

const axiosInstance = axios.create({
  baseURL: `${
    baseURLs[env.NEXT_PUBLIC_ENVIRONMENT] || env.NEXT_PUBLIC_API_BASE_URL_DEV
  }/api/v1/kittykat-agent`,
});

// Request interceptor: Attach token to Authorization header
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getClientSideToken();
    console.log(token);
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
      if (newToken) {
        config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(config); // Retry request with new token
      }
    }

    return Promise.reject(error); // Propagate other errors
  }
);

export default axiosInstance;
