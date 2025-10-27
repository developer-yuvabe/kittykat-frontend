// src/services/brand.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import { BaseApiResponse, ThreadCampaign, ThreadDetails } from "@/types/types";
import axios from "@/config/axios/api-client.config";
import { BrandResponse, ThreadFileResponse } from "@/types/brand.types";

export async function updateCampaignMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  moodboardData: Record<string, unknown>
): Promise<BrandResponse> {
  return handleApiRequest<BrandResponse>(
    axiosInstance.put(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}`,
      {
        ...moodboardData,
      }
    )
  );
}

export async function deleteCampaignMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string
): Promise<BrandResponse> {
  return handleApiRequest<BrandResponse>(
    axiosInstance.delete(
      `/brands/${brandId}/campaign/${campaignId}/moodboard/${moodboardId}`
    )
  );
}

export const uploadThreadFile = async (
  brandId: string,
  file: File,
  purpose: string = "user_data"
): Promise<ThreadFileResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);

    const response = await axios.post<BaseApiResponse<ThreadFileResponse>>(
      `/brands/${brandId}/thread-files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const { status_code, message, data } = response.data;

    if (status_code === 201 && data) {
      return data;
    } else {
      throw new Error(message || "Failed to upload thread file.");
    }
  } catch (error: any) {
    console.error("Error uploading thread file:", error);
    throw new Error(
      error.response?.data?.message || "Unexpected error while uploading file."
    );
  }
};

export async function deleteA2iImage(
  brand_id: string,
  image_id: string
): Promise<{ brand_id: string; image_id: string }> {
  return handleApiRequest<{ brand_id: string; image_id: string }>(
    axiosInstance.delete(`/brands/${brand_id}/a2i/images/${image_id}`)
  );
}

export async function updateBrand(
  brandId: string,
  brandData: Record<string, any>
): Promise<ThreadDetails> {
  return handleApiRequest<ThreadDetails>(
    axiosInstance.patch(`/brands/${brandId}`, brandData)
  );
}

export async function updateBrandSocialMediaField(
  brandId: string,
  field: keyof NonNullable<
    NonNullable<ThreadDetails["brand_information"]>["static"]
  >["social_media"],
  value: string
): Promise<ThreadDetails> {
  const payload = {
    [`brand_information.static.social_media.${field}`]: value,
  };

  return updateBrand(brandId, payload);
}

export async function createCampaign(
  brandId: string,
  campaignData: Omit<ThreadCampaign, "id">
): Promise<ThreadCampaign> {
  return handleApiRequest<ThreadCampaign>(
    axiosInstance.post(`/brands/${brandId}/campaign`, campaignData)
  );
}

export async function updateCampaign(
  brandId: string,
  campaignId: string,
  campaignData: Partial<ThreadCampaign>
): Promise<ThreadCampaign> {
  return handleApiRequest<ThreadCampaign>(
    axiosInstance.put(`/brands/${brandId}/campaign/${campaignId}`, campaignData)
  );
}

export async function updateCampaignName(
  brandId: string,
  campaignId: string,
  title: string
): Promise<ThreadCampaign> {
  return updateCampaign(brandId, campaignId, {
    campaign: { title },
  });
}
export async function addDeprioritizedIds(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  deprioritizedIds: string[]
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/deprioritized-ids`,
      {
        brand_id: brandId,
        campaign_id: campaignId,
        deprioritized_ids: deprioritizedIds,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  );
}
