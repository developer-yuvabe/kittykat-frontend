import "server-only";

import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { clientConfig, serverConfig } from "../firebase.config";
import { env } from "../env";
import { AppConfig } from "../app.config";

const getServerSideToken = async () => {
  try {
    const tokens = await getTokens(await cookies(), {
      apiKey: clientConfig.apiKey,
      cookieName: serverConfig.cookieName,
      cookieSignatureKeys: serverConfig.cookieSignatureKeys,
      serviceAccount: serverConfig.serviceAccount,
    });

    return tokens!.token;
  } catch (error) {
    console.error("Error getting tokens:", error);
    return null;
  }
};

const axiosInstance = axios.create({
  baseURL: `${
    AppConfig.BASE_URLS[env.NEXT_PUBLIC_ENVIRONMENT] ||
    env.NEXT_PUBLIC_API_BASE_URL_DEV
  }/api/v1/kittykat-agent`,
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authToken = await getServerSideToken();
    if (authToken) {
      config.headers = new AxiosHeaders({
        ...config.headers,
        Authorization: `Bearer ${authToken}`,
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
