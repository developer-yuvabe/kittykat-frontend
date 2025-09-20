import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const retryGeneration = async (
  generationId: string,
  brandId: string
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/generations/${generationId}/retry`, {
        brand_id: brandId,
      })
    );
  } catch (error) {
    console.error("Error retrying generation:", error);
    throw error;
  }
};
