import { HumanInterrupt } from "@langchain/langgraph/prebuilt";
import { v4 as uuidv4 } from "uuid";
import { Message, ToolMessage } from "@langchain/langgraph-sdk";

export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";

export function isAgentInboxInterruptSchema(
  value: unknown
): value is HumanInterrupt | HumanInterrupt[] {
  const valueAsObject = Array.isArray(value) ? value[0] : value;
  return (
    valueAsObject &&
    typeof valueAsObject === "object" &&
    "action_request" in valueAsObject &&
    typeof valueAsObject.action_request === "object" &&
    "config" in valueAsObject &&
    typeof valueAsObject.config === "object" &&
    "allow_respond" in valueAsObject.config &&
    "allow_accept" in valueAsObject.config &&
    "allow_edit" in valueAsObject.config &&
    "allow_ignore" in valueAsObject.config
  );
}

export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const newMessages: ToolMessage[] = [];

  messages.forEach((message, index) => {
    if (message.type !== "ai" || message.tool_calls?.length === 0) {
      // If it's not an AI message, or it doesn't have tool calls, we can ignore.
      return;
    }
    // If it has tool calls, ensure the message which follows this is a tool message
    const followingMessage = messages[index + 1];
    if (followingMessage && followingMessage.type === "tool") {
      // Following message is a tool message, so we can ignore.
      return;
    }

    // Since the following message is not a tool message, we must create a new tool message
    newMessages.push(
      ...(message.tool_calls?.map((tc) => ({
        type: "tool" as const,
        tool_call_id: tc.id ?? "",
        id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
        // id: uuidv4(),
        name: tc.name,
        content: "Successfully handled tool call.",
      })) ?? [])
    );
  });

  return newMessages;
}

// Configuration file for tool loading messages
export type LoadingMessageConfig = {
  message: string;
  animation?: "pulse" | "bounce" | "spin" | "fade";
  icon?: string; // Optional icon name if you want to add icons later
  duration?: number; // Animation duration in seconds
};

// Map of tool names to their loading message configurations
export const TOOL_LOADING_MESSAGES: Record<
  string,
  LoadingMessageConfig | LoadingMessageConfig[]
> = {
  // Brand tools
  "scrape-brand": {
    message: "Gathering brand data...",
    animation: "pulse",
  },
  "generate-themes": {
    message: "Generating Themes...",
    animation: "pulse",
  },
  "generate-moodboards": {
    message: "Creating moodboards...",
    animation: "pulse",
  },
};

// Helper function to get a loading message for a tool
export function getLoadingMessageForTool(
  toolName: string
): LoadingMessageConfig | null {
  const config = TOOL_LOADING_MESSAGES[toolName];

  if (!config) {
    return {
      message: "Kittykat is thinking...",
      animation: "pulse",
    };
  }

  // If it's an array of messages, randomly select one
  if (Array.isArray(config)) {
    return config[Math.floor(Math.random() * config.length)];
  }

  return config;
}

export const capitalizeKey = (key: string) => {
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
