import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { User } from "@/types/types";

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<User | null> => {
  try {
    const updatedUser = await handleApiRequest<User | null>(
      axiosInstance.put(`/users/${userId}`, {
        ...data,
      })
    );

    return updatedUser;
  } catch {
    return null;
  }
};
