import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ERROR_MESSAGES } from "./constants";
import { FirebaseError } from "firebase/app";
import { AxiosResponse } from "axios";

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

export async function handleApiRequest<T>(
  request: Promise<AxiosResponse>
): Promise<T> {
  try {
    const response = await request;

    // Check for successful status code (200-299)
    if (response.status >= 200 && response.status < 300) {
      return response.data.data as T;
    }

    // Handle unexpected non-2xx status codes
    const message =
      response.data?.message || `Unexpected status code: ${response.status}`;
    console.error("API Error:", message);
    throw new Error(message);
  } catch (error: any) {
    console.error("API Request Error:", error);

    // Prefer the message from the API response if present
    const message =
      error.response?.data?.message || error.message || "API request failed";

    throw new Error(message);
  }
}

export function isValidUrl(url: string): boolean {
  try {
    console.log("Validating URL:", url);
    new URL(url);
    return true;
  } catch (_error) {
    console.log("Invalid URL:", _error);
    return false;
  }
}
