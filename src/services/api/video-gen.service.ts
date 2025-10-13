import axiosInstance from "@/config/axios/api-client.config"; // adjust path as needed
import { handleApiRequest } from "@/lib/utils"; // adjust path as needed
import { A2iVideoGenerationResponse } from "@/types/a2i-video.types";

export const videoGenerationService = async (
  brandId: string,
  data: Record<string, any>
) => {
  try {
    return await handleApiRequest<A2iVideoGenerationResponse>(
      axiosInstance.post(`/brands/${brandId}/a2i/video-generation`, {
        ...data,
      })
    );
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};

export const deleteA2iVideo = async (brandId: string, generationId: string) => {
  try {
    return await handleApiRequest(
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

export const estimateVideoGenerationCredits = async (
  data: Record<string, any>
) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/credits/estimate/video-generation`, data)
    );
    return credits;
  } catch (error) {
    console.error("Error estimating video generation credits:", error);
    throw error;
  }
};

export const generateAnimationPrompt = async (
  preset: "smooth" | "dynamic",
  prompt?: string
) => {
  try {
    return await handleApiRequest<string>(
      axiosInstance.post(`/a2i/actions/animate`, {
        preset,
        input_prompt: prompt,
      })
    );
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};
