import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { vtonSchema } from "@/schema/vton.schema";
import { z } from "zod";

export const createVtonImage = async (
  userId: string,
  brandId: string,
  data: z.infer<typeof vtonSchema>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/vton`, {
        user_id: userId,
        product_image: data.product_image,
        model_image: data.model_image,
        prompt: data.prompt,
      })
    );
  } catch (error) {
    console.error("Error occured during vton:", error);
    throw error;
  }
};
