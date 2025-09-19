import { Client } from "@langchain/langgraph-sdk";

export function createClient() {
  if (typeof window === "undefined") {
    return null;
  }
  return new Client({
    apiUrl: new URL("/api/langgraph", window.location.href).href,
  });
}

export const client = createClient();
