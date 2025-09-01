import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { z } from "zod";

export const upscalerSchema = z.object({
  image_url: z.string().min(1, "Image URL is required"),
  scale_factor: z.enum(["2x", "4x", "8x", "16x"]),
  optimized_for: z.enum([
    "standard",
    "soft_portraits",
    "hard_portraits",
    "art_n_illustration",
    "videogame_assets",
    "nature_n_landscapes",
    "films_n_photography",
    "3d_renders",
    "science_fiction_n_horror",
  ]),
  creativity: z.number().min(-10).max(10),
  hdr: z.number().min(-10).max(10),
  resemblance: z.number().min(-10).max(10),
  fractality: z.number().min(-10).max(10),
  engine: z.enum([
    "automatic",
    "magnific_illusio",
    "magnific_sharpy",
    "magnific_sparkle",
  ]),
  prompt: z.string().optional(),
  base_image: z.string().optional(),
});

export const upscaleImage = async (
  brandId: string,
  data: z.infer<typeof upscalerSchema>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/image-upscaling`, data)
    );
  } catch (error) {
    console.error("Error upscaling image:", error);
    throw error;
  }
};
