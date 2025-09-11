import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const createVtonImage = async (
  brandId: string,
  data: Record<string, any>,
  campaignId?: string | null
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/vton`, {
        ...data,
        campaign_id: campaignId,
      })
    );
  } catch (error) {
    console.error("Error occured during vton:", error);
    throw error;
  }
};

export const estimateVtonCredits = async (data: Record<string, any>) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/credits/estimate/vton`, {
        ...data,
      })
    );

    return credits;
  } catch (error) {
    console.error("Error occured during vton credits estimation:", error);
    throw error;
  }
};
