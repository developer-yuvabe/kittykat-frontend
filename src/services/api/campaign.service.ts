import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  CampaignCreate,
  CampaignResponse,
  CampaignUpdate,
  VisualImage,
} from "@/types/campaign.types";

export async function createCampaign(
  brandId: string,
  payload: CampaignCreate
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.post(`/brands/${brandId}/campaign`, payload)
  );
}

export async function updateCampaign(
  brandId: string,
  campaignId: string,
  payload: CampaignUpdate
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.put(`/brands/${brandId}/campaign/${campaignId}`, payload)
  );
}

export async function addVisualImage(
  brandId: string,
  campaignId: string,
  image: VisualImage
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/visual-image`,
      image
    )
  );
}

interface ImageAnalysisLimits {
  pinterest_limit?: number;
  instagram_limit?: number;
  facebook_limit?: number;
}

export async function analyzeCampaignImages(
  brandId: string,
  campaignId: string,
  limits: ImageAnalysisLimits = {} // optional param with defaults
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/visual-image/analysis`,
      limits
    )
  );
}

export interface ImageAnalysisRequest {
  user_id: string;
  urls: string[];
}

export async function analyzeCampaignMoodboard(
  brandId: string,
  campaignId: string,
  request: ImageAnalysisRequest
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/image-analysis`,
      request
    )
  );
}

export interface AddVisualImage {
  url: string;
}

export async function addVisualImageToCampaign(
  brandId: string,
  campaignId: string,
  image: AddVisualImage
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/visual-image`,
      image
    )
  );
}
