import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { Model } from "@/types/a2i-media.types";

export const getModels = async (): Promise<Model[]> => {
  try {
    return await handleApiRequest<Model[]>(axiosInstance.get(`/models`));
  } catch (error) {
    console.error("Error fetching models:", error);
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
