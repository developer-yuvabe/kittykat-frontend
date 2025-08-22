import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const createVtonImage = async (
  brandId: string,
  modelImage: string,
  productImage: string,
  addToQueue: boolean,
  campaignId?: string | null
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/vton`, {
        model_image: modelImage,
        product_image: productImage,
        should_add_to_queue: addToQueue,
        campaign_id: campaignId,
      })
    );
  } catch (error) {
    console.error("Error occured during vton:", error);
    throw error;
  }
};

export const estimateVtonCredits = async (
  modelImage: string,
  productImage: string | null
) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/a2i/vton/estimate-credits`, {
        model_image: modelImage,
        product_image: productImage,
      })
    );

    return credits;
  } catch (error) {
    console.error("Error occured during vton credits estimation:", error);
    throw error;
  }
};
