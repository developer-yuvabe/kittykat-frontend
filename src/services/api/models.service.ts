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

export const estimatePricing = async (
  model_data: Record<string, string>
): Promise<number> => {
  try {
    const data = await handleApiRequest<{
      credits: number;
    }>(
      axiosInstance.post(`/models/estimate-credits`, {
        ...model_data,
      })
    );

    return data.credits;
  } catch (error) {
    console.error("Error estimating pricing:", error);
    throw error;
  }
};
