import { getApiKey } from "@/lib/api-key";
import { DEFAULT_API_URL } from "@/lib/constants";
import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey,
    apiUrl,
  });
}

export const client = createClient(DEFAULT_API_URL, getApiKey() ?? undefined);
