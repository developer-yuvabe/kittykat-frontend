import { z } from "zod";

// Define the schema that matches the backend models
const logoRulesSchema = z.object({
  minimum_size: z.string().min(1, "Minimum size is required"),
  clear_space: z.string().min(1, "Clear space is required"),
  prohibited_uses: z
    .array(z.string())
    .min(1, "At least one prohibited use is required"),
});

const logoSchema = z.object({
  primary: z.string().min(1, "Primary logo URL is required"),
  alternate: z
    .array(z.string())
    .min(1, "At least one alternate logo is required"),
  rules: logoRulesSchema.optional(),
});

const fontSchema = z.object({
  name: z.string().min(1, "Font name is required"),
  weights: z.array(z.string()).min(1, "At least one font weight is required"),
  usage: z.string().min(1, "Font usage is required"),
});

const typographySchema = z.object({
  primary_font: fontSchema,
  secondary_font: fontSchema,
});

const colorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  hex: z.string(),
  rgb: z.string().min(1, "RGB value is required"),
});

const creativeApproachCastingSchema = z.object({
  description: z.string().min(1, "Description is required"),
  goal: z.string().min(1, "Goal is required"),
});

const creativeApproachRepresentationSchema = z.object({
  values: z.array(z.string()).min(1, "At least one value is required"),
  guidelines: z.string().min(1, "Guidelines are required"),
});

const creativeApproachSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  casting: creativeApproachCastingSchema,
  network: z.string().min(1, "Network is required"),
  representation: creativeApproachRepresentationSchema,
});

const videoGuidelinesStylingSchema = z.object({
  principles: z
    .array(z.string())
    .min(1, "At least one styling principle is required"),
});

const videoGuidelinesLightSchema = z.object({
  principles: z
    .array(z.string())
    .min(1, "At least one light principle is required"),
});

const videoGuidelinesPosingSchema = z.object({
  style: z.string().min(1, "Posing style is required"),
});

const videoGuidelinesSettingSchema = z.object({
  role: z.string().min(1, "Setting role is required"),
});

const videoGuidelinesMotionSchema = z.object({
  approach: z.string().min(1, "Motion approach is required"),
  camera_work: z.string().min(1, "Camera work is required"),
  lighting: z.string().min(1, "Lighting is required"),
});

const videoGuidelinesLegDownSchema = z.object({
  intent: z.string().min(1, "Leg down intent is required"),
});

const videoGuidelinesStillLifeSchema = z.object({
  presentation: z.string().min(1, "Still life presentation is required"),
});

const videoGuidelinesSchema = z.object({
  styling: videoGuidelinesStylingSchema,
  light: videoGuidelinesLightSchema,
  posing: videoGuidelinesPosingSchema,
  setting: videoGuidelinesSettingSchema,
  motion: videoGuidelinesMotionSchema,
  leg_down: videoGuidelinesLegDownSchema,
  still_life: videoGuidelinesStillLifeSchema,
});

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  mission: z.string().min(1, "Mission is required"),
  vision: z.string().min(1, "Vision is required"),
  values: z.array(z.string()).min(1, "At least one value is required"),
});

// Main form schema
export const createBrandSchema = z.object({
  brand: brandSchema,
  logo: logoSchema.optional(),
  typography: typographySchema.optional(),
  colors: z.record(colorSchema).optional(),
  creative_approach: creativeApproachSchema.optional(),
  video_guidelines: videoGuidelinesSchema.optional(),
});

export const urlExtractionSchema = z.object({
  brand_url: z.string(),
});
