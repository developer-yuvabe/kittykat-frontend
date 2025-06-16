import { z } from "zod";

export const vtonSchema = z.object({
  product_image: z.string().url(),
  model_image: z.string().url(),
  prompt: z.string().optional(),
});
