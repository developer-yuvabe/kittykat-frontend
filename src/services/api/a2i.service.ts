import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { gptImage1Schema } from "@/schema/image-gen.schema";
import { z } from "zod";

export const generateImage = async (
  brandId: string,
  data: z.infer<typeof gptImage1Schema>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/image-generation`, {
        ...data,
      })
    );
  } catch (error) {
    console.error("Error remixing image:", error);
    throw error;
  }
};
