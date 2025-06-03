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
import { PinnedItem } from "@/store/usePinnedContextStore";
import type {
  Base64ContentBlock,
  URLContentBlock,
} from "@langchain/core/messages";
import { toast } from "sonner";

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
      hex: color?.hex?.startsWith("#") ? color?.hex : `#${color?.hex}`,
    }))
    .filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color?.hex));

export function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export const getPinnedItemContextMessage = (pinnedItem: PinnedItem) => {
  const { title, context } = pinnedItem;
  const agentHint = context.agentId
    ? `You must use this agent: ${context.agentId}`
    : "";

  const readableContext =
    typeof context.data === "string"
      ? context.data
      : JSON.stringify(context.data, null, 2); // Pretty-printed JSON

  return `<kittykat-do-not-render>${
    agentHint ? agentHint + "\n\n" : ""
  }Focus only on "${title}".\n\nHere is the relevant context:\n${readableContext}\n
  Please ignore <kittykat-do-not-render> tag.
  </kittykat-do-not-render>`;
};

// Returns a Promise of a typed multimodal block for images or PDFs
export async function fileToContentBlock(
  file: File
): Promise<Base64ContentBlock> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const supportedFileTypes = [...supportedImageTypes, "application/pdf"];

  if (!supportedFileTypes.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${
        file.type
      }. Supported types are: ${supportedFileTypes.join(", ")}`
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  if (supportedImageTypes.includes(file.type)) {
    return {
      type: "image",
      source_type: "base64",
      mime_type: file.type,
      data,
      metadata: { name: file.name },
    };
  }

  // PDF
  return {
    type: "file",
    source_type: "base64",
    mime_type: "application/pdf",
    data,
    metadata: { filename: file.name },
  };
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for Base64ContentBlock
export function isBase64ContentBlock(
  block: unknown
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file type (legacy)
  if (
    (block as { type: unknown }).type === "file" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}

// Type guard for URLContentBlock
export function isURLContentBlock(block: unknown): block is URLContentBlock {
  if (typeof block !== "object" || block === null) return false;

  const maybeBlock = block as Partial<URLContentBlock>;

  return (
    (maybeBlock.type === "image" ||
      maybeBlock.type === "audio" ||
      maybeBlock.type === "file") &&
    maybeBlock.source_type === "url" &&
    typeof maybeBlock.url === "string"
  );
}

export function formatUpdateMessage(
  fieldPath: string,
  oldValue: string,
  newValue: string,
  agentHint?: string,
  prettyLabel?: string,
  customDoNotRenderMessage?: string
): string | null {
  const derivedLabel =
    fieldPath
      .split(".")
      .pop()
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Field";

  const label = prettyLabel || derivedLabel;

  if (oldValue === newValue) {
    return null;
  }

  const baseMessage = `Let's update the ${label} from "${oldValue}" to "${newValue}".`;

  const doNotRenderBlock = customDoNotRenderMessage
    ? `
    
    <kittykat-do-not-render>
    \n
    ${agentHint ? `Agent Hint - You must use this agent: ${agentHint}\n` : ""}
    ${customDoNotRenderMessage}\n</kittykat-do-not-render>`
    : `<kittykat-do-not-render>
        Key: ${fieldPath}
        ${
          agentHint
            ? `Agent Hint - You must use this agent: ${agentHint}\n`
            : ""
        }
        Action: ${baseMessage}
      </kittykat-do-not-render>`;

  return `${baseMessage}${doNotRenderBlock}`;
}

export function formatUpdateArrayMessage(
  fieldPath: string,
  oldArray: string[],
  newArray: string[],
  agentHint?: string,
  prettyLabel?: string
): string | null {
  // Return null if no change
  if (JSON.stringify(oldArray) === JSON.stringify(newArray)) {
    return null;
  }

  const derivedLabel =
    fieldPath
      .split(".")
      .pop()
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Field";

  const label = prettyLabel || derivedLabel;

  const oldValFormatted = oldArray.length ? oldArray.join(", ") : "(empty)";
  const newValFormatted = newArray.length ? newArray.join(", ") : "(empty)";

  const baseMessage = `Let's update the ${label} from [${oldValFormatted}] to [${newValFormatted}].`;

  return `${baseMessage}<kittykat-do-not-render>
Key: ${fieldPath}
${agentHint ? `Agent Hint - You must use this agent: ${agentHint}\n` : ""}
Action: Update the array field **${fieldPath}** with the new list of values below:
Updated Array: ${JSON.stringify(newArray)}
</kittykat-do-not-render>`;
}
