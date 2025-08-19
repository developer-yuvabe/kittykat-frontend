import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string) {
  return new Client({
    apiUrl,
  });
}

export const client = createClient(
  new URL("/api/langgraph", window.location.href).href
);
