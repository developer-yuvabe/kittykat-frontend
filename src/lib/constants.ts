import { VideoPreset } from "@/types/a2i-video.types";

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

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "dolly-forward",
    name: "Dolly Forward",
    description: "Camera moves forward toward subject",
    technique: "Dolly forward movement toward subject",
  },
  {
    id: "dolly-backward",
    name: "Dolly Backward",
    description: "Camera moves backward revealing more space",
    technique: "Dolly backward movement away from subject",
  },
  {
    id: "zoom-in",
    name: "Zoom In",
    description: "Zoom toward subject while camera stays static",
    technique: "Zoom in toward subject, camera static",
  },
  {
    id: "zoom-out",
    name: "Zoom Out",
    description: "Zoom away from subject while camera stays static",
    technique: "Zoom out from subject, camera static",
  },
  {
    id: "pan-left",
    name: "Pan Left",
    description: "Camera rotates horizontally to the left",
    technique: "Pan camera horizontally to the left",
  },
  {
    id: "pan-right",
    name: "Pan Right",
    description: "Camera rotates horizontally to the right",
    technique: "Pan camera horizontally to the right",
  },
  {
    id: "tilt-up",
    name: "Tilt Up",
    description: "Camera rotates vertically upward",
    technique: "Tilt camera vertically upward",
  },
  {
    id: "tilt-down",
    name: "Tilt Down",
    description: "Camera rotates vertically downward",
    technique: "Tilt camera vertically downward",
  },
  {
    id: "orbit-clockwise",
    name: "Orbit Clockwise",
    description: "Camera circles around subject clockwise",
    technique: "180 degree orbit camera clockwise around subject",
  },
  {
    id: "orbit-counter",
    name: "Orbit Counter-Clockwise",
    description: "Camera circles around subject counter-clockwise",
    technique: "180 degree orbit camera counter-clockwise around subject",
  },
  {
    id: "tracking-walk",
    name: "Tracking Shot",
    description: "Camera follows subject in motion",
    technique: "Tracking shot following subject in motion",
  },
  {
    id: "dolly-zoom",
    name: "Dolly Zoom",
    description: "Dolly + zoom in opposite directions (Vertigo effect)",
    technique: "Dolly zoom (Vertigo effect)",
  },
  {
    id: "2-shot-dynamic",
    name: "2-Shot Dynamic Story",
    description: "AI builds a 2-part story from your context (Setup → Reveal)",
    technique: "Build dynamic 2-part story",
    isMultiShot: true,
    shotCount: 2,
  },
  {
    id: "3-shot-dynamic",
    name: "3-Shot Dynamic Story",
    description:
      "AI builds a 3-part story from your context (Setup → Development → Resolution)",
    technique: "Build dynamic 3-part story",
    isMultiShot: true,
    shotCount: 3,
  },
];
