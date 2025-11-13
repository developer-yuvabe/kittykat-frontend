import React from "react";
import { HumanInterrupt } from "@langchain/langgraph/prebuilt";
import { v4 as uuidv4 } from "uuid";
import {
  AIMessage,
  Message,
  Thread,
  ToolMessage,
} from "@langchain/langgraph-sdk";
import { RENDER_FILE_ID_PREFIX, MAX_IMAGE_UPLOAD_SIZE } from "./constants";
import { Dispatch, SetStateAction } from "react";
import { FileTextIcon, Music, Video, Image } from "lucide-react";
import {
  Color,
  MessageContentFiles,
  PinnedMoodboardItem,
} from "@/types/langgraph.types";
import { getContentString } from "@/components/thread/utils";
import { validate } from "uuid";
import { PinnedItem } from "@/store/usePinnedContextStore";
import type {
  Base64ContentBlock,
  MessageContentComplex,
  URLContentBlock,
} from "@langchain/core/messages";
import { toast } from "sonner";
import { parsePartialJson } from "@langchain/core/output_parsers";

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

export function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[]
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

// types.ts - Add these type definitions
type LoadingMessageConfig = {
  message: string;
  duration?: number;
  animation?: "shimmer" | "pulse" | "dots";
};

// langgraph.utils.ts - Enhanced loading message configuration
const TOOL_LOADING_MESSAGES: Record<
  string,
  LoadingMessageConfig | LoadingMessageConfig[]
> = {
  "scrape-brand": [
    { message: "Extracting brand data from website...", duration: 3 },
    { message: "Analyzing brand elements...", duration: 3 },
    { message: "Collecting visual styles...", duration: 3 },
    { message: "Processing brand information...", duration: 3 },
    { message: "Just a moment—finalizing the brand scrape...", duration: 6 },
    {
      message: "Almost there! Ensuring all brand elements are captured...",
      duration: 30,
    },
  ],
  "update-brand": [
    { message: "Updating brand profile...", duration: 3 },
    { message: "Syncing brand changes...", duration: 3 },
    { message: "Applying brand updates...", duration: 2 },
    { message: "Finalizing brand configuration...", duration: 3 },
    {
      message: "One last step... Verifying consistency across updates.",
      duration: 10,
    },
  ],
  "parse-brandbook": [
    { message: "Analyzing brand guidelines...", duration: 3 },
    { message: "Extracting style elements...", duration: 3 },
    { message: "Processing brand standards...", duration: 2 },
    { message: "Parsing visual identity...", duration: 4 },
    {
      message: "Double-checking typography and color schemes...",
      duration: 4,
    },
    {
      message: "Finalizing brandbook extraction. Thanks for your patience!",
      duration: 30,
    },
  ],
  "update-campaign": [
    { message: "Applying updates to campaign content...", duration: 3 },
    { message: "Refreshing campaign structure...", duration: 2 },
    { message: "Syncing campaign changes...", duration: 3 },
    { message: "Reviewing campaign consistency...", duration: 4 },
    { message: "Finalizing campaign updates...", duration: 3 },
    {
      message: "Almost done! Making sure everything looks great...",
      duration: 5,
    },
  ],
  "analyze-moodboard": [
    { message: "Analyzing moodboard content...", duration: 3 },
    { message: "Extracting visual elements...", duration: 4 },
    { message: "Identifying key themes...", duration: 4 },
    { message: "Generating insights...", duration: 5 },
    { message: "Finalizing moodboard analysis...", duration: 20 },
  ],
  generate_image: [
    {
      message: "Finalizing prompt for image creation...",
      duration: 2,
    },
    {
      message: "Choosing best parameters for the visual model...",
      duration: 3,
    },
    {
      message: "Generating image based on the prompt...",
      duration: 20,
    },
  ],
  edit_image: [
    {
      message: "Preparing image for editing...",
      duration: 2,
    },
    {
      message: "Applying edits to the image...",
      duration: 15,
    },
    {
      message: "Finalizing the edited image...",
      duration: 5,
    },
  ],
  generate_video: [
    {
      message: "Finalizing prompt for video creation...",
      duration: 2,
    },
    {
      message: "Choosing best parameters for the visual model...",
      duration: 3,
    },
    {
      message: "Generating video based on the prompt and frames attached...",
      duration: 20,
    },
  ],
};

// Helper function to get loading messages for a tool
export function getLoadingMessagesForTool(
  toolName: string
): LoadingMessageConfig[] | LoadingMessageConfig | null {
  const config = TOOL_LOADING_MESSAGES[toolName];

  if (!config) {
    return {
      message: "Processing your request...",
      duration: 2.2,
      animation: "shimmer",
    };
  }

  return config;
}

export const genericMessages = [
  "Processing your request...",
  "Analyzing information...",
  "Converting thoughts into words...",
  "Brainstorming ideas...",
  "Working on your request...",
  "Crafting a response...",
  "Connecting the dots...",
  "Organizing thoughts...",
  "Formulating a detailed answer...",
  "Generating insights...",
  "Exploring possibilities...",
];

export const capitalizeKey = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function normalizeJsonToString(input: unknown): string {
  if (input === null || input === undefined) return "None";

  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean")
    return String(input);

  if (Array.isArray(input)) {
    if (input.length === 0) return "Empty list";
    return input.map(normalizeJsonToString).join(", ");
  }

  if (typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>);
    if (entries.length === 0) return "Empty object";
    return entries
      .map(([, val]) => `${normalizeJsonToString(val)}`)
      .join(" | ");
  }

  return String(input);
}

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

/**
 * Validates image upload size and returns files that can be uploaded within the 50MB limit
 * @param files - Array of files to validate
 * @param existingSize - Size of already uploaded images in bytes (default: 0)
 * @returns Object with valid files array and rejected files array with reasons
 */
export function validateImageUploadSize(
  files: File[],
  existingSize: number = 0
): {
  validFiles: File[];
  rejectedFiles: { file: File; reason: string }[];
  totalSize: number;
} {
  const validFiles: File[] = [];
  const rejectedFiles: { file: File; reason: string }[] = [];
  let currentSize = existingSize;

  for (const file of files) {
    // Check if adding this file would exceed the limit
    if (currentSize + file.size > MAX_IMAGE_UPLOAD_SIZE) {
      rejectedFiles.push({
        file,
        reason: `Adding ${file.name} would exceed the 50MB limit`,
      });
    } else {
      validFiles.push(file);
      currentSize += file.size;
    }
  }

  return {
    validFiles,
    rejectedFiles,
    totalSize: currentSize,
  };
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
    ? `<kittykat-do-not-render>
${
  agentHint ? `Agent Hint - You must use this agent: ${agentHint}\n` : ""
}${customDoNotRenderMessage}
</kittykat-do-not-render>`
    : `<kittykat-do-not-render>
Key: ${fieldPath}
${
  agentHint ? `Agent Hint - You must use this agent: ${agentHint}\n` : ""
}Action: ${baseMessage}
</kittykat-do-not-render>`;

  return `${baseMessage.trimEnd()}${doNotRenderBlock}`;
}

export function formatUpdateArrayMessage(
  fieldPath: string,
  oldArray: string[],
  newArray: string[],
  agentHint?: string,
  prettyLabel?: string,
  extraInfo?: string // New parameter
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
${
  agentHint ? `Agent Hint - You must use this agent: ${agentHint}\n` : ""
}Action: Update the array field **${fieldPath}** with the new list of values below:
Updated Array: ${JSON.stringify(newArray)}
${extraInfo ? `\n${extraInfo}` : ""}
</kittykat-do-not-render>`;
}

/**
 * Get pinned moodboard context message for chat input
 */
export const getPinnedMoodboardContextMessage = (
  pinnedMoodboard: PinnedMoodboardItem
) => {
  const { moodboard } = pinnedMoodboard;

  return `<kittykat-do-not-render>
 

Moodboard Data:
- Moodboard ID: ${moodboard.moodboard_id}
- Campaign ID: ${moodboard.campaign_id}
- Moodboard Preview: ${moodboard.screenshot_url}

Please analyze this moodboard and provide creative feedback as a professional creative director would. Include:
1. Overall impression and style summary
2. Strengths of the current selection
3. Gaps or missing elements
4. Concrete next steps with specific recommendations

Make sure to trigger analyze-moodboard toolcall in the MoodboardAgent always even its not explicitly asked in the user prompt or its triggered in previous messages.

Please ignore <kittykat-do-not-render> tag.
</kittykat-do-not-render>`;
};

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
