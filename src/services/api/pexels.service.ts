import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { PexelsTopicsResponse } from "@/types/pexels.types";

export const fetchTopics = async (
  brandId: string,
  campaignId: string | null | undefined
): Promise<PexelsTopicsResponse> => {
  return await handleApiRequest<PexelsTopicsResponse>(
    axiosInstance.post("/pexels/topics", {
      brand_id: brandId,
      campaign_id: campaignId,
    })
  );
};
