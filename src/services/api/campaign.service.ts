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

export type VisualImagePatchPayload = {
  is_liked?: boolean;
  ignored?: boolean;
};

export async function patchVisualImage(
  brandId: string,
  campaignId: string,
  imageId: string,
  updates: VisualImagePatchPayload
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.patch(
      `/brands/${brandId}/campaign/${campaignId}/visual-image/${imageId}`,
      updates
    )
  );
}

export interface ManualMoodboardAsset {
  id: string;
  position: number;
}

export async function updateManualMoodboardAssets(
  brandId: string,
  campaignId: string,
  assets: ManualMoodboardAsset[]
): Promise<CampaignResponse> {
  return handleApiRequest<any>(
    axiosInstance.patch(
      `/brands/${brandId}/campaign/${campaignId}/manual-moodboard-assets`,
      assets
    )
  );
}

export interface CreateMoodboardRequest {
  no_of_images: number;
}

export async function createManualMoodboardForCampaign(
  brandId: string,
  campaignId: string,
  data: CreateMoodboardRequest
): Promise<null> {
  return handleApiRequest<null>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/manual-moodboard`,
      data
    )
  );
}

export interface AddMoodboardImageRequest {
  id: string;
}

export async function addManualMoodboardImage(
  brandId: string,
  campaignId: string,
  data: AddMoodboardImageRequest
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/manual-moodboard-assets`,
      data
    )
  );
}

export interface ReplaceMoodboardImageRequest {
  image_to_replace_id: string;
  replacement_image_url: string;
}

export async function replaceManualMoodboardImage(
  brandId: string,
  campaignId: string,
  data: ReplaceMoodboardImageRequest
): Promise<CampaignResponse> {
  return handleApiRequest<CampaignResponse>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/manual-moodboard-assets/replace`,
      data
    )
  );
}
