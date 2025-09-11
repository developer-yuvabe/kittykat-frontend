// import axiosInstance from "@/config/axios/api-client.config";
// import { handleApiRequest } from "@/lib/utils";

// export type Topic = {
//   id: number;
//   topic: string;
//   thumbnail_url: string;
// };

// export const fetchTopics = async (): Promise<Topic[]> => {
//   return await handleApiRequest<Topic[]>(axiosInstance.get("/pexels/topics"));
// };

import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { PexelsTopicsResponse } from "@/types/pexels.types";

// export type Topic = {
//   id: string;
//   topic: string;
//   thumbnail_url: string;
// };

// export type PexelsTopicsResponse = {
//   editor_choice: string;
//   topics: Topic[];
// };

export const fetchTopics = async (
  brandId: string,
  campaignId: string | null | undefined
): Promise<PexelsTopicsResponse> => {
  console.log(
    "Fetching topics with brandId:",
    brandId,
    "and campaignId:",
    campaignId
  );
  return await handleApiRequest<PexelsTopicsResponse>(
    axiosInstance.post("/pexels/topics", {
      brand_id: brandId,
      campaign_id: campaignId,
    })
  );
};
