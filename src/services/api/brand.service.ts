// src/services/brand.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { A2iImageUpdateRequest } from "@/hooks/useParameterManagement";
import { handleApiRequest } from "@/lib/utils";

import { BaseApiResponse, ThreadA2iImage } from "@/types/types";
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

// API functions - moved outside hook to prevent recreation
export const updateA2iImageParameters = async (
  brandId: string,
  payload: A2iImageUpdateRequest
): Promise<BaseApiResponse<ThreadA2iImage>> => {
  const response = await axios.put<BaseApiResponse<ThreadA2iImage>>(
    `/brands/${brandId}/a2i`,
    payload
  );
  return response.data;
};

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
    axiosInstance.delete(`/brands/${brand_id}/images/${image_id}`)
  );
}
