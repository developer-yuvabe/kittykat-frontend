import axios from "axios";
import { env } from "../env";
import { auth } from "../firebase.config";

const getClientSideToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      // Refresh the token and cache it
      const token = await currentUser.getIdToken(true); // true forces a refresh
      return token;
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  }

  return null;
};

const baseURLs = {
  prod: env.NEXT_PUBLIC_API_BASE_URL_PROD,
  stg: env.NEXT_PUBLIC_API_BASE_URL_STG,
  dev: env.NEXT_PUBLIC_API_BASE_URL_DEV,
};

const axiosInstance = axios.create({
  baseURL: `${
    baseURLs[env.ENVIRONMENT] || env.NEXT_PUBLIC_API_BASE_URL_DEV
  }/api/v1/kittykat-agent`,
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
      if (newToken) {
        config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(config); // Retry request with new token
      }
    }

    return Promise.reject(error); // Propagate other errors
  }
);

export default axiosInstance;
