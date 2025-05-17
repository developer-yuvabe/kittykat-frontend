import React from "react";
import { HumanInterrupt } from "@langchain/langgraph/prebuilt";
import { v4 as uuidv4 } from "uuid";
import { Message, Thread, ToolMessage } from "@langchain/langgraph-sdk";
import { RENDER_FILE_ID_PREFIX } from "./constants";
import { Dispatch, SetStateAction } from "react";
import { FileTextIcon, Music, Video, Image } from "lucide-react";
import { Color, MessageContentFiles } from "@/types/langgraph.types";
import { getContentString } from "@/components/thread/utils";
import { validate } from "uuid";

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
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function addFileWrappers(
  url: string,
  setFileList: Dispatch<SetStateAction<MessageContentFiles[]>>
) {
  const id = uuidv4();
  const newWrappers: MessageContentFiles[] = [
    {
      id: `${RENDER_FILE_ID_PREFIX}${id}`,
      file: {
        type: "text",
        text: url,
      },
    },
    {
      id: `${DO_NOT_RENDER_ID_PREFIX}${id}`,
      file: {
        type: "text",
        text: `I've just uploaded a file related to my previous message. Please refer to the preceding message for context, as this file might be part of an ongoing discussion. Let me know if you need more information about this file or if you have any questions.`,
      },
    },
  ];

  setFileList((prev) => [...prev, ...newWrappers]);
}

export function removeFileWrappers(
  id: string,
  setFileList: Dispatch<SetStateAction<MessageContentFiles[]>>
) {
  const renderId = `${RENDER_FILE_ID_PREFIX}${id}`;
  const doNotRenderId = `${DO_NOT_RENDER_ID_PREFIX}${id}`;

  setFileList((prev) =>
    prev.filter(
      (wrapper) => wrapper.id !== renderId && wrapper.id !== doNotRenderId
    )
  );
}

export const fetchFileType = async (fileUrl: string) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch: ${response.statusText}`);
    return response.headers.get("Content-Type") || "application/octet-stream";
  } catch (error) {
    console.error("Error fetching file type:", error);
    return "application/octet-stream";
  }
};

export const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  text: FileTextIcon,
  application: FileTextIcon,
};

export async function getFileIcon(url: string): Promise<React.ElementType> {
  const contentType = await fetchFileType(url);
  if (!contentType) return FileTextIcon;

  const [type] = contentType.split("/");
  return fileTypeIcons[type] || File;
}

export const getThreadDisplayName = (thread: Thread) => {
  if (
    typeof thread.metadata === "object" &&
    thread.metadata &&
    "name" in thread.metadata &&
    thread.metadata.name
  ) {
    return String(thread.metadata.name);
  } else if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    return getContentString(firstMessage.content).slice(0, 50);
  }
  return thread.thread_id;
};

function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgbWithOpacity(hex: string) {
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);
  const alpha = parseInt(hex.substring(6, 8) || "FF", 16) / 255;

  return { red, green, blue, alpha };
}

export function getFontColorForBackground(backgroundColor: string) {
  const hex = backgroundColor.replace("#", "");
  const { red, green, blue, alpha } = hexToRgbWithOpacity(hex);

  // Blend with white background based on alpha
  const blendedRed = Math.round(red * alpha + 255 * (1 - alpha));
  const blendedGreen = Math.round(green * alpha + 255 * (1 - alpha));
  const blendedBlue = Math.round(blue * alpha + 255 * (1 - alpha));

  const luminance = getLuminance(blendedRed, blendedGreen, blendedBlue);

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export const extractAllColors = (staticData?: any): Color[] => {
  if (!staticData?.colors) return [];

  const { primary, secondary, others } = staticData.colors;

  const labeledColors = [
    ...(primary ? [{ ...primary, label: "Primary" }] : []),
    ...(secondary ? [{ ...secondary, label: "Secondary" }] : []),
    ...(Array.isArray(others)
      ? others.map((color) => ({ ...color, label: color.name }))
      : []),
  ];

  return labeledColors;
};

export const filterAndNormalizeColors = (colors: Color[]): Color[] =>
  colors
    .map((color) => ({
      ...color,
      hex: color.hex.startsWith("#") ? color.hex : `#${color.hex}`,
    }))
    .filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color.hex));

export function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}
