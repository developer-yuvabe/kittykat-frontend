import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  SubFolderCreate,
  SubFolderUpdate,
  SubFolderResponse,
} from "@/types/campaign.types";

/**
 * Create a new subfolder inside a campaign
 */
export async function createSubfolder(
  brandId: string,
  campaignId: string,
  payload: SubFolderCreate
): Promise<SubFolderResponse> {
  return handleApiRequest<SubFolderResponse>(
    axiosInstance.post(
      `/brands/${brandId}/campaign/${campaignId}/subfolders`,
      payload
    )
  );
}

/**
 * Update an existing subfolder
 */
export async function updateSubfolder(
  brandId: string,
  campaignId: string,
  subfolderId: string,
  payload: SubFolderUpdate
): Promise<SubFolderResponse> {
  return handleApiRequest<SubFolderResponse>(
    axiosInstance.patch(
      `/brands/${brandId}/campaign/${campaignId}/subfolders/${subfolderId}`,
      payload
    )
  );
}

/**
 * Delete a subfolder from a campaign
 */
export async function deleteSubfolder(
  brandId: string,
  campaignId: string,
  subfolderId: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.delete(
      `/brands/${brandId}/campaign/${campaignId}/subfolders/${subfolderId}`
    )
  );
}
