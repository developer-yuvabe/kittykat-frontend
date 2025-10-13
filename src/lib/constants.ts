export const FORM_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Password must be at least 6 characters long.",
  INVALID_USERNAME: "Username is required.",
};

export const ERROR_MESSAGES = {
  ACCOUNT_CREATION_FAILED:
    "Something went wrong while creating the account. Please try again.",
  GENERAL_ERROR: "Something went wrong. Please try again later.",

  EMAIL_ALREADY_EXISTS: "Email already exists. Please use a different email.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
};

export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";

export const RENDER_FILE_ID_PREFIX = "render-file-";

export const KITTYKAT_AGENT_ID = "agent";

// Maximum total size for image uploads per message (50MB)
export const MAX_IMAGE_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export const MAX_PDF_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB in bytes
