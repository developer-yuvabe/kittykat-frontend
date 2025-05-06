import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ERROR_MESSAGES } from "./constants";
import { FirebaseError } from "firebase/app";

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
