import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const createVtonImage = async (
  brandId: string,
  modelImage: string,
  productImage: string
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/vton`, {
        model_image: modelImage,
        product_image: productImage,
      })
    );
  } catch (error) {
    console.error("Error occured during vton:", error);
    throw error;
  }
};
