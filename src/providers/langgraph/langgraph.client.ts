import { env } from "@/config/env";
import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey,
    apiUrl,
  });
}

export const client = createClient(
  env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER,
  env.NEXT_PUBLIC_LANGSMITH_API_KEY
);
