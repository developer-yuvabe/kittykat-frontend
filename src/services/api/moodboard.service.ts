import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  AddMoodboardImageRequest,
  AnalyzeMoodboardRequest,
  CreateMoodboardRequest,
  MoodboardCreateRequest,
  MoodboardImageAnalysisRequest,
  MoodboardPatchRequest,
  ReplaceMoodboardImageRequest,
} from "@/types/moodboard.types";
import { MoodboardAsset, MoodboardInformation } from "@/types/types";

/**
 * Create a new moodboard under a campaign and brand.
 *
 * @param brandId - Brand identifier
 * @param campaignId - Campaign identifier
 * @param payload - Moodboard creation payload
 */
export async function createMoodboard(
  brandId: string,
  campaignId: string,
  payload: MoodboardCreateRequest
): Promise<MoodboardInformation> {
  return await handleApiRequest<MoodboardInformation>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard`,
      payload
    )
  );
}

/**
 * Schedule image analysis for all visual images in a moodboard.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param limits - Image limits for Pinterest, Instagram, Facebook
 */
export async function analyzeMoodboardImages(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  limits: MoodboardImageAnalysisRequest
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/visual-image/analysis`,
      limits
    )
  );
}

/**
 * Patch moodboard details for a brand.
 *
 * @param brandId - Brand ID
 * @param moodboardId - Moodboard ID
 * @param payload - Partial fields to update
 * @returns Updated moodboard information
 */
export async function patchMoodboard(
  brandId: string,
  moodboardId: string,
  payload: MoodboardPatchRequest
): Promise<MoodboardInformation> {
  return handleApiRequest<MoodboardInformation>(
    axiosInstance.patch(`/brands/${brandId}/moodboard/${moodboardId}`, payload)
  );
}

/**
 * Schedule moodboard creation as a background task for a campaign.
 *
 * @param brandId - Brand identifier
 * @param campaignId - Campaign identifier
 * @param moodboardId - Moodboard identifier
 * @param payload - Request payload with no_of_images
 */
export async function createMoodboardForCampaign(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  payload: CreateMoodboardRequest
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/create`,
      payload
    )
  );
}

/**
 * Add an image to a moodboard in a campaign.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param payload - Object with image ID to add
 */
export async function addImageToMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  payload: AddMoodboardImageRequest
): Promise<MoodboardInformation> {
  return handleApiRequest<MoodboardInformation>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/asset`,
      payload
    )
  );
}

/**
 * Replaces an image in a moodboard with a new one using a provided image URL.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param payload - Image replacement data
 */
export async function replaceMoodboardImage(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  payload: ReplaceMoodboardImageRequest
): Promise<MoodboardInformation> {
  return handleApiRequest<MoodboardInformation>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/replace-image`,
      payload
    )
  );
}

/**
 * Update manual moodboard assets (reordering/removal) for a campaign.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param assets - List of moodboard assets with positions
 */
export async function updateMoodboardAssets(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  assets: MoodboardAsset[]
): Promise<MoodboardInformation> {
  return handleApiRequest<MoodboardInformation>(
    axiosInstance.patch(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/asset`,
      assets
    )
  );
}

/**
 * Analyze selected images in the moodboard and update tags.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param payload - Payload with list of image URLs
 */
export async function analyzeMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  payload: AnalyzeMoodboardRequest
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/analyze`,
      payload
    )
  );
}

export interface GalleryItemReferencePayload {
  gallery_item_id: string;
}

export const addGalleryItemToMoodboard = async (
  brandId: string,
  moodboardId: string,
  payload: GalleryItemReferencePayload
): Promise<MoodboardInformation> => {
  return handleApiRequest<MoodboardInformation>(
    axiosInstance.post<MoodboardInformation>(
      `/brands/${brandId}/moodboard/${moodboardId}/visual-style-reference`,
      payload
    )
  );
};

export const generateA2iShowboard = async (
  brandId: string,
  moodboardId: string,
  n: number = 3
): Promise<void> => {
  return handleApiRequest<void>(
    axiosInstance.post<void>(`/brands/${brandId}/a2i/prompt-generation`, {
      moodboard_id: moodboardId,
      num_of_prompts: n,
    })
  );
};

export const enhancePrompt = async (
  brandId: string,
  basePrompt: string
): Promise<{
  prompts: string[];
}> => {
  return handleApiRequest<{
    prompts: string[];
  }>(
    axiosInstance.post<{
      prompts: string[];
    }>(`/brands/${brandId}/a2i/enhance-prompt`, {
      base_prompt: basePrompt,
    })
  );
};
