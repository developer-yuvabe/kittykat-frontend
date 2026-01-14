import { env } from "./env";

export const AppConfig = {
  APP_NAME: "KittyKat",

  PUBLIC_PATHS: [
    "/login",
    "/forgot-password",
    /^\/invitations\/[^\/]+$/,
    "/signup",
    "/verify-email",
  ],
  HOME_ROUTE: "/",
  API_BASE_URL: {
    prod: env.NEXT_PUBLIC_API_BASE_URL_PROD,
    stg: env.NEXT_PUBLIC_API_BASE_URL_STG,
    dev: env.NEXT_PUBLIC_API_BASE_URL_DEV,
    beta: env.NEXT_PUBLIC_API_BASE_URL_BETA,
  }[env.NEXT_PUBLIC_ENVIRONMENT],
  KITTYKAT_AGENT_SERVER: {
    prod: env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER_PROD,
    stg: env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER_STG,
    dev: env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER_DEV,
    beta: env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER_BETA,
  }[env.NEXT_PUBLIC_ENVIRONMENT],
  AUTH_TENANT_ID: {
    prod: env.NEXT_PUBLIC_TENANT_ID_PROD,
    stg: env.NEXT_PUBLIC_TENANT_ID_STG,
    dev: env.NEXT_PUBLIC_TENANT_ID_DEV,
    beta: env.NEXT_PUBLIC_TENANT_ID_BETA,
  }[env.NEXT_PUBLIC_ENVIRONMENT],
  MAX_FILE_SIZE: 32 * 1024 * 1024, // 32 MB
  TABLE_VIEW_LIMIT: 50,
  // Credits validation constants
  CREDITS: {
    MIN: 0,
    MAX: Number.MAX_SAFE_INTEGER, // 9,007,199,254,740,991 - Maximum safe integer in JavaScript (within MongoDB's 64-bit range)
  },
  DEFAULT_CREDITS: 1000,
  DEFAULT_TOKENS: 10000,
  DEFUALT_SECTIONS_EXPANDED_VIEW: true,
};
