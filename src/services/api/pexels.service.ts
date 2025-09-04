import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

export type Topic = {
  id: number;
  topic: string;
  thumbnail_url: string;
};

export const fetchTopics = async (): Promise<Topic[]> => {
  return await handleApiRequest<Topic[]>(axiosInstance.get("/pexels/topics"));
};
