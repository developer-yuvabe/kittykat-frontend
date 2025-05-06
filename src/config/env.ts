// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    FIREBASE_ADMIN_CLIENT_EMAIL: z.string().min(1),
    FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),
    AUTH_COOKIE_NAME: z.string().min(1),
    AUTH_COOKIE_SIGNATURE_KEY_CURRENT: z.string().min(1),
    AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS: z.string().min(1),
    USE_SECURE_COOKIES: z.string(),
    ENVIRONMENT: z.enum(["prod", "stg", "dev"]).default("dev"),
  },
  client: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_API_BASE_URL_PROD: z.string().url(),
    NEXT_PUBLIC_API_BASE_URL_STG: z.string().url(),
    NEXT_PUBLIC_API_BASE_URL_DEV: z.string().url(),
  },

  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   * This is also important for Docker builds.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    AUTH_COOKIE_SIGNATURE_KEY_CURRENT:
      process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT,
    AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS:
      process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS,
    USE_SECURE_COOKIES: process.env.USE_SECURE_COOKIES,
    ENVIRONMENT: process.env.ENVIRONMENT,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_API_BASE_URL_PROD: process.env.NEXT_PUBLIC_API_BASE_URL_PROD,
    NEXT_PUBLIC_API_BASE_URL_STG: process.env.NEXT_PUBLIC_API_BASE_URL_STG,
    NEXT_PUBLIC_API_BASE_URL_DEV: process.env.NEXT_PUBLIC_API_BASE_URL_DEV,
  },
});
