import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const remixImageService = async (
  brandId: string,
  campaignId: string | null | undefined,
  data: Record<string, any>,
  maskImageUrl: string | null,
  product_reference_images?: string[],
  enhance_prompt_for_products?: boolean,
  team_id?: string
) => {
  try {
    const payload: Record<string, any> = {
      ...data,
      campaign_id: campaignId,
      product_reference_images: product_reference_images || [],
      enhance_prompt_for_product: enhance_prompt_for_products || false,
      team_id: team_id || undefined,
    };

    if (maskImageUrl) {
      payload["mask_image"] = maskImageUrl;
    }

    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/remix`, payload)
    );
  } catch (error) {
    console.error("Error remixing image:", error);
    throw error;
  }
};

export const estimateRemixCredits = async (data: Record<string, any>) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/credits/estimate/remix`, data)
    );

    return credits;
  } catch (error) {
    console.error("Error estimating remix credits:", error);
    throw error;
  }
};
