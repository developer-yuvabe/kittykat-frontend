import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export const deleteQueueItems = async (queueItemIds: string[]) => {
  try {
    return await handleApiRequest(
      axiosInstance.delete(`/queue`, {
        data: {
          ids: queueItemIds,
        },
      })
    );
  } catch (error) {
    console.error("Error deleting queue items:", error);
    throw error;
  }
};
