import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const transcribeAudio = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { transcription } = await handleApiRequest<{ transcription: string }>(
      axiosInstance.post("/api/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );

    return transcription;
  } catch (error) {
    console.error("Error during audio transcription:", error);
    throw error;
  }
};
