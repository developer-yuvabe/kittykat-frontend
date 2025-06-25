import { z } from "zod";

export const remixImageSchema = z.object({
  base_image: z.string().url(),
  reference_images: z.array(z.string().url()),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]),
  prompt: z.string().min(1, "Prompt is required"),
  n: z
    .number()
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed"),
});
