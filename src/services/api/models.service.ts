import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { Model } from "@/types/a2i-media.types";

// Get all models (admin only - existing function)
export const getModels = async (): Promise<Model[]> => {
  try {
    return await handleApiRequest(axiosInstance.get(`/models`));
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};

export const getUserModels = async (
  userId: string,
  type?: string
): Promise<Model[]> => {
  try {
    const params = type ? { type_filter: type } : {};
    return await handleApiRequest(
      axiosInstance.get(`/users/${userId}/models`, { params })
    );
  } catch (error) {
    console.error("Error fetching user models:", error);
    throw error;
  }
};

export const estimatePricing = async (model_data: Record<string, string>) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/credits/estimate/image-generation`, {
        ...model_data,
      })
    );
    return credits;
  } catch (error) {
    console.error("Error estimating pricing:", error);
    throw error;
  }
};
