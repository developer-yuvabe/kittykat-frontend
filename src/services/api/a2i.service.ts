import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { z, ZodTypeAny } from "zod";

export const generateImage = async <T extends ZodTypeAny>(
  brandId: string,
  data: z.infer<T>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/image-generation`, {
        ...data,
      })
    );
  } catch (error) {
    console.error("Error remixing image:", error);
    throw error;
  }
};

export const deleteA2iImage = async (
  brandId: string,
  generationId: string,
  imageId: string | null
) => {
  try {
    await handleApiRequest(
      axiosInstance.delete(`/brands/${brandId}/a2i/images`, {
        data: {
          generation_id: generationId,
          image_id: imageId,
        },
      })
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const toggleA2iImageLike = async (
  brandId: string,
  generationId: string,
  imageId: string,
  isLiked: boolean
) => {
  try {
    await handleApiRequest(
      axiosInstance.put(`/brands/${brandId}/a2i/images`, {
        generation_id: generationId,
        image_id: imageId,
        is_liked: isLiked,
      })
    );
  } catch (error) {
    console.error("Error toggling image like status:", error);
    throw error;
  }
};
