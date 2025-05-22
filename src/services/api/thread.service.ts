import axiosInstance from "@/config/axios/api-client.config";

export const deleteThreadInformation = async (threadId: string) => {
  try {
    // Get the presigned URL
    await axiosInstance.delete(`/threads/${threadId}`);
  } catch (error) {
    console.error("Failed to delete thread:", error);
    throw new Error("Thread deletion failed. Please try again.");
  }
};
