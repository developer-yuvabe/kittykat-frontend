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


export const deleteA2iVideo = async (brandId: string, generationId: string) => {
  try {
    await handleApiRequest(
      axiosInstance.delete(`/brands/${brandId}/a2i/video`, {
        data: {
          generation_id: generationId,
        },
      })
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const toggleA2iVideoLike = async (
  brandId: string,
  generationId: string,
  isLiked: boolean
) => {
  try {
    await handleApiRequest(
      axiosInstance.put(`/brands/${brandId}/a2i/video/like`, {
        generation_id: generationId,
        is_liked: isLiked,
      })
    );
  } catch (error) {
    console.error("Error toggling image like status:", error);
    throw error;
  }
};
