import { z } from "zod";

export const gptImage1Schema = z
  .object({
    prompt: z.string().trim().min(1),
    provider: z.literal("openai"),
    model: z.literal("gpt-image-1"),
    reference_images: z.array(z.string()).max(10).optional(),
    size: z.enum(["1024x1024", "1536x1024", "1024x1536"]),
    n: z.number().min(1).max(10),
    output_format: z.enum(["png", "webp", "jpeg"]),
    quality: z.enum(["low", "medium", "high"]),
    output_compression: z.number().min(0).max(100),
    background: z.enum(["auto", "transparency", "opaque"]),
    moderation: z.enum(["auto", "low"]),
  })
  .superRefine((data, ctx) => {
    if (data.output_format === "png" && data.output_compression !== 100) {
      ctx.addIssue({
        path: ["output_compression"],
        code: z.ZodIssueCode.custom,
        message: "PNG must have output_compression set to 100%",
      });
    }
    if (data.output_format === "jpeg" && data.background === "transparency") {
      ctx.addIssue({
        path: ["background"],
        code: z.ZodIssueCode.custom,
        message: "JPEG does not support transparent background",
      });
    }
  });
