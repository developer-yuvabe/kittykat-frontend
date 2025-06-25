import { z } from "zod";

export const videoGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  provider: z.literal("replicate"),
  model: z.literal("kwaivgi/kling-v1.5-standard"),
  start_image: z.string().url(),
  negative_prompt: z.string().optional(),
  duration: z.union([z.literal(5), z.literal(10)]),
  cfg_scale: z.number().min(0).max(1),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]),
});
