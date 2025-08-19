import { AppConfig } from "@/config/app.config";
import { env } from "@/config/env";
import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl: AppConfig.KITTYKAT_AGENT_SERVER,
    apiKey: env.LANGSMITH_API_KEY,
    runtime: "edge",
    baseRoute: "langgraph",
    disableWarningLog: true,
  });
