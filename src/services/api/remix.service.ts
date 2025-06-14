import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { remixImageSchema } from "@/schema/remix.schema";
import { z } from "zod";

export const remixImageService = async (
  brandId: string,
  userId: string,
  data: z.infer<typeof remixImageSchema>,
  maskImageUrl: string
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/remix`, {
        user_id: userId,
        prompt: data.prompt,
        size: data.size,
        n: data.n,
        base_image: data.base_image,
        reference_images: data.reference_images,
        mask_image: maskImageUrl,
      })
    );
  } catch (error) {
    console.error("Error remixing image:", error);
    throw error;
  }
};
