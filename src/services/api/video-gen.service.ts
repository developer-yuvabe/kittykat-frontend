import axiosInstance from "@/config/axios/api-client.config"; // adjust path as needed
import { handleApiRequest } from "@/lib/utils"; // adjust path as needed

export const videoGenerationService = async (
  brandId: string,
  data: Record<string, any>,
  campaignId?: string | null
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/video-generation`, {
        ...data,
        campaign_id: campaignId,
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
      axiosInstance.post(`/a2i/video/estimate-credits`, data)
    );
    return credits;
  } catch (error) {
    console.error("Error estimating video generation credits:", error);
    throw error;
  }
};
