import { env } from "./env";

export const serverConfig = {
  cookieName: env.AUTH_COOKIE_NAME!,
  cookieSignatureKeys: [
    env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
    env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS!,
  ],
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: env.USE_SECURE_COOKIES === "true",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24,
  },
  serviceAccount: {
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  },
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY!,
};
