import { env } from "@/config/env";
import { getApiKey } from "@/lib/api-key";
import { KITTYKAT_AGENT_SERVER } from "@/lib/constants";
import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey,
    apiUrl,
  });
}

export const client = createClient(
  KITTYKAT_AGENT_SERVER,
  getApiKey() ?? undefined
);
