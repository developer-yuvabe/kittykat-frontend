import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { env } from "./env";

export const clientConfig = {
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export const app = initializeApp(clientConfig);
const auth = getAuth(app);
export { auth };
