import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { AppConfig } from "../app.config";
import { serverConfig } from "../firebase-server.config";

export const getServerSideToken = async () => {
  try {
    const tokens = await getTokens(await cookies(), {
      apiKey: serverConfig.apiKey,
      cookieName: serverConfig.cookieName,
      cookieSignatureKeys: serverConfig.cookieSignatureKeys,
      serviceAccount: serverConfig.serviceAccount,
    });

    return tokens;
  } catch (error) {
    console.error("Error getting tokens:", error);
    return null;
  }
};

const axiosInstance = axios.create({
  baseURL: `${AppConfig.API_BASE_URL}/api/v1`,
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authToken = await getServerSideToken();
    if (authToken) {
      config.headers = new AxiosHeaders({
        ...config.headers,
        Authorization: `Bearer ${authToken.token}`,
        ContentType: "application/json",
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      throw new Error("Unauthorized");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
