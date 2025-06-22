import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { z, ZodTypeAny } from "zod";

export const generateImage = async <T extends ZodTypeAny>(
  brandId: string,
  data: z.infer<T>
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
