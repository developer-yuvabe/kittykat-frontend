import { env } from "./env";

export const AppConfig = {
  APP_NAME: "KittyKat",

  PUBLIC_PATHS: ["/login", "/signup"],
  HOME_ROUTE: "/",
  BASE_URLS: {
    prod: env.NEXT_PUBLIC_API_BASE_URL_PROD,
    stg: env.NEXT_PUBLIC_API_BASE_URL_STG,
    dev: env.NEXT_PUBLIC_API_BASE_URL_DEV,
  },
};
