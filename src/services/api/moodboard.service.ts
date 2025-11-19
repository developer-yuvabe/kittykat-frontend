import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  AddMoodboardImageRequest,
  AutoFillSuggestedImage,
  GenerateMoodboardScreenshotRequest,
  MoodboardCreateRequest,
  MoodboardPatchRequest,
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
 * delete moodboard by moodboard ID.
 *
 * @param brandId - Brand ID
 * @param moodboardId - Moodboard ID
 */
export async function deleteMoodboard(
  brandId: string,
  moodboardId: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.delete(`/brands/${brandId}/moodboard/${moodboardId}`)
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
  moodboardId: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/analyze`
    )
  );
}

export const generateA2iShowboard = async (
  brandId: string,
  moodboardId: string,
  referenceMoodboardAssets?: MoodboardAsset[],
  n: number = 3
): Promise<void> => {
  return handleApiRequest<void>(
    axiosInstance.post<void>(`/brands/${brandId}/a2i/prompt-generation`, {
      moodboard_id: moodboardId,
      num_of_prompts: n,
      reference_moodboard_assets: referenceMoodboardAssets ?? null,
    })
  );
};

export const enhancePrompt = async (
  brandId: string,
  basePrompt: string,
  referenceMoodboardId?: string
): Promise<{
  prompt: string;
}> => {
  return handleApiRequest<{
    prompt: string;
  }>(
    axiosInstance.post<{
      prompt: string;
    }>(`/brands/${brandId}/a2i/enhance-prompt`, {
      base_prompt: basePrompt,
      moodboard_id: referenceMoodboardId ?? null,
    })
  );
};

/**
 * Generate prompts from a preset with advanced inputs.
 * This initiates a background task that will update the moodboard upon completion.
 *
 * @param brandId - Brand ID
 * @param moodboardId - Moodboard ID to store generated prompts
 * @param payload - Prompt generation request payload
 * @returns Response indicating the task has been initiated (202 Accepted)
 */
export async function generateAdvancedPrompts(
  brandId: string,
  moodboardId: string,
  payload: {
    preset_id: string;
    product_references?: string[];
    context_references?: string[];
    prompt?: string;
    negative_prompt?: string;
    n?: number;
  }
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(`/presets/generate-prompts`, {
      brand_id: brandId,
      moodboard_id: moodboardId,
      preset_id: payload.preset_id,
      product_references: payload.product_references || [],
      context_references: payload.context_references || [],
      prompt: payload.prompt || null,
      negative_prompt: payload.negative_prompt ?? null,
      n: payload.n || 3,
    })
  );
}

export async function getAutoFillMoodboardSuggestedImages(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  count: number
): Promise<AutoFillSuggestedImage[]> {
  return handleApiRequest<AutoFillSuggestedImage[]>(
    axiosInstance.get(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/auto-fill`,
      {
        params: { count },
      }
    )
  );
}

/**
 * Generate a screenshot of the moodboard and return the URL.
 *
 * @param brandId - Brand ID
 * @param campaignId - Campaign ID
 * @param moodboardId - Moodboard ID
 * @param payload - Screenshot generation payload
 * @returns Object containing the screenshot URL
 */
export async function generateMoodboardScreenshot(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  payload: GenerateMoodboardScreenshotRequest
): Promise<{ url: string }> {
  return handleApiRequest<{ url: string }>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}/screenshot`,
      payload
    )
  );
}
