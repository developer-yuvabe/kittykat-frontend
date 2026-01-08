import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ERROR_MESSAGES } from "./constants";
import { FirebaseError } from "firebase/app";
import { AxiosResponse } from "axios";
import { AppConfig } from "@/config/app.config";
import { toast } from "sonner";
import { Model } from "@/types/a2i-media.types";
import {
  OpenAIIcon,
  ReplicateIcon,
  BytePlusIcon,
  GeminiIcon,
} from "@/components/ui/custom-icon";
import { ComponentIcon } from "lucide-react";
// config/navigation.config.ts
import { HomeIcon, GalleryIcon } from "@/components/ui/custom-icon";
import { ListTodo, Users, Users2, Columns3Cog } from "lucide-react";
import { UserRoleId } from "@/types/user.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const processAuthError = (e: unknown) => {
  let errorMsg = ERROR_MESSAGES.GENERAL_ERROR;
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/email-already-exists":
        errorMsg = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
        break;
      case "auth/email-already-in-use":
        errorMsg = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
        break;
      case "auth/email-already-in-use":
        errorMsg = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
        break;
      case "auth/invalid-email":
        errorMsg = ERROR_MESSAGES.INVALID_CREDENTIALS;
        break;
      case "auth/invalid-password":
        errorMsg = ERROR_MESSAGES.INVALID_CREDENTIALS;
        break;
      case "auth/user-not-found":
        errorMsg = ERROR_MESSAGES.INVALID_CREDENTIALS;
        break;
      case "auth/invalid-credential":
        errorMsg = ERROR_MESSAGES.INVALID_CREDENTIALS;
        break;
      case "auth/wrong-password":
        errorMsg = ERROR_MESSAGES.INVALID_CREDENTIALS;
        break;
      case "":
        errorMsg = ERROR_MESSAGES.ACCOUNT_CREATION_FAILED;
        break;
      default:
        errorMsg = ERROR_MESSAGES.GENERAL_ERROR;
        break;
    }
  }

  return errorMsg;
};

// Checks if a color is near white
export const isNearWhite = (hex: string) => {
  const rgb = parseInt(hex.replace("#", ""), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r + g + b) / 3;
  return brightness > 230; // Threshold for "near white"
};

export class PlatformApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "PlatformApiError";
  }
}

export async function handleApiRequest<T>(
  request: Promise<AxiosResponse>
): Promise<T> {
  try {
    const response = await request;

    // Check for successful status code (200-299)
    if (response.data.status_code >= 200 && response.data.status_code < 300) {
      // console.log("API Response:", response.data.data);
      return response.data.data as T;
    }

    // Handle unexpected non-2xx status codes
    const message =
      response.data?.message || `Unexpected status code: ${response.status}`;
    console.error("API Error:", message);
    throw new PlatformApiError(message, response.data.status_code);
  } catch (error: any) {
    console.error("API Request Error:", error);

    // Extract the error message
    let message = error.response?.data?.message || error.message || "API request failed";
    
    // Handle backend Pydantic validation errors
    if (typeof message === 'string' && message.includes('validation error for')) {
      console.error("Backend validation error detected:", message);
      
      // Extract a cleaner error message for common patterns
      if (message.includes('BaseApiResponse') || message.includes('ServiceResponse')) {
        message = "The service encountered an internal error. Please try again or contact support if the issue persists.";
      }
    }

    if (error instanceof PlatformApiError) {
      throw error;
    }

    throw new Error(message);
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getSSEBaseUrl(): string {
  return `${AppConfig.API_BASE_URL}/api/v1/sse`;
}

export const handleDownloadImage = async (
  url: string,
  options?: {
    filename?: string;
    toastMessages?: {
      loading?: string;
      success?: string;
      error?: string;
    };
  }
) => {
  const {
    filename = getFilenameFromUrl(url),
    toastMessages = {
      loading: "Downloading image...",
      success: "Image downloaded successfully!",
      error: "Failed to download image. Please try again.",
    },
  } = options || {};

  toast.promise(
    (async () => {
      const imageResponse = await fetch(url, { mode: "cors" });
      if (!imageResponse.ok)
        throw new Error(`HTTP error! status: ${imageResponse.status}`);

      const blob = await imageResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })(),
    {
      loading: toastMessages.loading,
      success: toastMessages.success,
      error: toastMessages.error,
    }
  );
};

export const handleDownloadVideo = async (
  url: string,
  options?: {
    filename?: string;
    toastMessages?: {
      loading?: string;
      success?: string;
      error?: string;
    };
  }
) => {
  const {
    filename = getFilenameFromUrl(url),
    toastMessages = {
      loading: "Downloading video...",
      success: "Video downloaded successfully!",
      error: "Failed to download video. Please try again.",
    },
  } = options || {};

  toast.promise(
    (async () => {
      const videoResponse = await fetch(url, { mode: "cors" });
      if (!videoResponse.ok)
        throw new Error(`HTTP error! status: ${videoResponse.status}`);

      const blob = await videoResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })(),
    {
      loading: toastMessages.loading,
      success: toastMessages.success,
      error: toastMessages.error,
    }
  );
};

export const formatToLocalTime = (dateString: string) => {
  try {
    // Parse the UTC date string and convert to local timezone
    const utcDate = new Date(
      dateString + (dateString.endsWith("Z") ? "" : "Z")
    );
    return utcDate.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    // Fallback to original string if parsing fails

    return dateString;
  }
};

export function getChatLayoutConfig(isLargeScreen: boolean) {
  return {
    containerHeight: isLargeScreen
      ? "h-[calc(100vh-8rem)]"
      : "h-[calc(100vh-6rem)]",
    containerPadding: isLargeScreen ? "px-4" : "px-3",
    threadPanelDefault: isLargeScreen ? 60 : 50, // decreased
    threadPanelMin: isLargeScreen ? 35 : 30, // decreased
    threadPanelMax: isLargeScreen ? 70 : 60, // decreased

    chatPanelDefault: isLargeScreen ? 40 : 50, // increased
    chatPanelMin: isLargeScreen ? 30 : 40, // increased
    chatPanelMax: isLargeScreen ? 80 : 70, // increased

    handleMargin: isLargeScreen ? "mx-3" : "mx-2",
    contentPadding: isLargeScreen ? "px-4" : "px-3",
    contentPaddingTop: isLargeScreen ? "pt-8" : "pt-6",
    logoSize: {
      width: isLargeScreen ? 100 : 90,
      height: isLargeScreen ? 40 : 36,
    },
    marginTop: isLargeScreen ? "mt-[15vh]" : "mt-[10vh]",
  };
}

export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e5e5e5" offset="20%" />
      <stop stop-color="#d4d4d4" offset="50%" />
      <stop stop-color="#e5e5e5" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f5f5f5" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

export const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, type);
  });

export const getExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const ext = lastSegment.includes(".") ? lastSegment.split(".").pop() : "";
    return ext?.toLowerCase() || "png";
  } catch {
    return "png";
  }
};

/**
 * Generates a filename from a given URL.
 * - If the URL is valid, it extracts the last segment of the path (the filename).
 * - If `haveExtension` is false, it removes the file extension from the extracted filename.
 * - If the URL is invalid or parsing fails, it returns a timestamp-based fallback.
 *
 * @param url - The input URL from which to extract the filename.
 * @param haveExtension - Whether to include the file extension in the result (default: true).
 * @returns The extracted filename (with or without extension), or a timestamp if parsing fails.
 */
export const getFilenameFromUrl = (
  url: string,
  haveExtension: boolean = true
): string => {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").pop() || "";

    if (!haveExtension) {
      const dotIndex = filename.lastIndexOf(".");
      return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    }

    return filename || `${Date.now()}`;
  } catch {
    return `${Date.now()}`;
  }
};

export const getZodFallback = (type: string) => {
  switch (type) {
    case "string":
    case "enum":
      return "";
    case "slider":
      return 0;
    case "boolean":
      return false;
    case "file":
      return null;
    default:
      return undefined;
  }
};

export function getImageDimensionsFromLocallyUploadedImage(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File is not an image"));
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to convert dataURL to blob
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const getProviderIcon = (provider: Model["provider"]) => {
  switch (provider) {
    case "openai":
      return OpenAIIcon;
    case "replicate":
      return ReplicateIcon;
    case "byteplus":
      return BytePlusIcon;
    case "gemini":
      return GeminiIcon;
    default:
      return ComponentIcon;
  }
};

export function getDimensionAndAspectRatioFromParameters(
  parameters: Record<string, any>
): string {
  const size = parameters.size || parameters.image_size;
  const ar = parameters.aspect_ratio;

  if (size && ar) {
    return ` - Size: ${size} - AR ${ar}`;
  } else if (size) {
    return ` - Size: ${size}`;
  } else if (ar) {
    return ` - AR ${ar}`;
  } else {
    return "";
  }
}

export async function urlToFile(url: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();

  const filename = url.split("/").pop()?.split("?")[0] || "file";

  return new File([blob], filename, { type: blob.type });
}

/**
 * Converts a value to match the target type based on the parameter definition's default value type.
 * Used when applying saved parameters to ensure type consistency with model schema.
 *
 * @param value - The value to convert (string or number)
 * @param paramDef - The parameter definition from the model schema
 * @returns The converted value matching the expected type
 */
export const convertParameterValue = (
  value: string | number,
  paramDef: any
): string | number => {
  if (!paramDef?.defaultValue) return value;

  const valueType = typeof value;
  const targetType = typeof paramDef.defaultValue;

  // If types already match, return as-is
  if (valueType === targetType) {
    return value;
  }

  // Convert if types don't match
  if (targetType === "number" && valueType === "string") {
    return parseInt(value as string, 10);
  }

  if (targetType === "string" && valueType === "number") {
    return value.toString();
  }

  return value;
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi)$/i;

/**
 * Returns true if URL looks like a video
 * Defaults to false (image)
 */
export function isVideoUrl(url?: string): boolean {
  if (!url) return false; // ✅ default = image
  return VIDEO_EXTENSIONS.test(url);
}

export interface NavLink {
  name: string;
  icon: any;
  path: string;
  disabled?: boolean;
  roles?: UserRoleId[];
}

export const NAVIGATION_LINKS: NavLink[] = [
  {
    name: "Home",
    icon: HomeIcon,
    path: "/",
    disabled: true,
    roles: [UserRoleId.ADMIN, UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
  },
  {
    name: "Gallery",
    icon: GalleryIcon,
    path: "/gallery",
    roles: [UserRoleId.ADMIN, UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
  },
  {
    name: "Task Lists",
    icon: ListTodo,
    path: "/tasklist",
    roles: [UserRoleId.ADMIN, UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
  },
  {
    name: "Teams",
    icon: Users2,
    path: "/teams",
    roles: [UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
  },
  {
    name: "Users",
    icon: Users,
    path: "/users",
    roles: [UserRoleId.ADMIN],
  },
  {
    name: "Presets",
    icon: Columns3Cog,
    path: "/presets",
    roles: [UserRoleId.ADMIN, UserRoleId.KK_CREATIVE_USER],
  },
];

export function filterLinksByRole(
  links: NavLink[],
  userRole: UserRoleId | undefined
): NavLink[] {
  if (!userRole) return links.filter((link) => !link.roles);

  return links.filter((link) => {
    if (!link.roles || link.roles.length === 0) return true;
    return link.roles.includes(userRole);
  });
}

export function getRoleLabel(
  role: UserRoleId,
  isDefaultAdmin?: boolean
): string {
  switch (role) {
    case UserRoleId.ADMIN:
      return isDefaultAdmin ? "System Admin" : "Creative Admin";
    case UserRoleId.USER:
      return "User";
    case UserRoleId.KK_CREATIVE_USER:
      return "Creative User";
  }
}
