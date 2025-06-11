import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ERROR_MESSAGES } from "./constants";
import { FirebaseError } from "firebase/app";
import { AxiosResponse } from "axios";
import { AppConfig } from "@/config/app.config";
import { env } from "@/config/env";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const processAuthError = (e: unknown) => {
  let errorMsg = ERROR_MESSAGES.GENERAL_ERROR;
  if (e instanceof FirebaseError) {
    console.log(e);
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
      return response.data.data as T;
    }

    // Handle unexpected non-2xx status codes
    const message =
      response.data?.message || `Unexpected status code: ${response.status}`;
    console.error("API Error:", message);
    throw new PlatformApiError(message, response.data.status_code);
  } catch (error: any) {
    console.error("API Request Error:", error);

    // Prefer the message from the API response if present
    const message =
      error.response?.data?.message || error.message || "API request failed";

    if (error instanceof PlatformApiError) {
      console.log("first");
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
  return `${
    AppConfig.BASE_URLS[env.NEXT_PUBLIC_ENVIRONMENT]
  }/api/v1/kittykat-agent/sse`;
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
    filename = `image_${new Date().getTime()}.jpg`,
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
  } catch (error) {
    // Fallback to original string if parsing fails
    console.log("Error parsing date:", error);
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
    threadPanelMin: isLargeScreen ? 20 : 30, // decreased
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
