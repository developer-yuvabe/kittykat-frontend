import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { remixImageSchema } from "@/schema/remix.schema";
import { z } from "zod";

export const remixImageService = async (
  brandId: string,
  campaignId: string | null | undefined,
  data: z.infer<typeof remixImageSchema>,
  maskImageUrl: string,
  addToQueue: boolean
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(
        `/brands/${brandId}/a2i/remix`,
        {
          prompt: data.prompt,
          size: data.size,
          n: data.n,
          base_image: data.base_image,
          reference_images: data.reference_images,
          mask_image: maskImageUrl,
          should_add_to_queue: addToQueue,
        },
        {
          params: {
            campaign_id: campaignId,
          },
        }
      )
    );
  } catch (error) {
    console.error("Error remixing image:", error);
    throw error;
  }
};

export const estimateRemixCredits = async (
  data: z.infer<typeof remixImageSchema>,
  maskImageUrl: string
) => {
  try {
    const credits = await handleApiRequest<number | null>(
      axiosInstance.post(`/a2i/remix/estimate-credits`, {
        prompt: data.prompt,
        size: data.size,
        n: data.n,
        base_image: data.base_image,
        reference_images: data.reference_images,
        mask_image: maskImageUrl,
      })
    );

    return credits;
  } catch (error) {
    console.error("Error estimating remix credits:", error);
    throw error;
  }
};
