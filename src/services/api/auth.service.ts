import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const sendPasswordResetEmail = async (email: string) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/users/reset-password`, {
        email,
        base_url: `${window.location.origin}`,
      })
    );
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
