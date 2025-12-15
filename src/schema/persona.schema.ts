import z from "zod";

export const personaSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  summary: z.string().optional(),
  image_url: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
  age_range: z.string().optional(),
  gender: z.string().optional(),
  location_focus: z.string().optional(),
  target_geography: z.string().optional(),
  life_stage: z.string().optional(),
  composition_mode: z
    .enum(["solo", "group", "couple", "family"])
    .optional()
    .or(z.literal("")),
  psychographics: z.string().optional(),
  pain_points: z.string().optional(),
  style_preferences: z.string().optional(),
  usage_contexts: z.string().optional(),
  visual_direction: z.string().optional(),
  messaging_angles: z.string().optional(),
  content_recommendations: z.string().optional(),
  do_guidelines: z.string().optional(),
  dont_guidelines: z.string().optional(),
});
