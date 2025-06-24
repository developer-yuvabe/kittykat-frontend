import { z } from "zod";
import { videoGenerationSchema } from "@/schema/video-gen.schema";
import axiosInstance from "@/config/axios/api-client.config"; // adjust path as needed
import { handleApiRequest } from "@/lib/utils"; // adjust path as needed

export const videoGenerationService = async (
  brandId: string,
  data: z.infer<typeof videoGenerationSchema>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/video-generation`, {
        prompt: data.prompt,
        start_image: data.start_image,
        negative_prompt: data.negative_prompt,
        duration: data.duration,
        cfg_scale: data.cfg_scale,
        aspect_ratio: data.aspect_ratio,
        provider: data.provider,
        model: data.model,
      })
    );
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};
