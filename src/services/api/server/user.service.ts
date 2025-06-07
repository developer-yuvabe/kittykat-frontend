import { handleApiRequest } from "@/lib/utils";
import axiosInstance from "@/config/axios/api-server.config";
import { User } from "@/types/user.types";

export const fetchUser = async () => {
  try {
    const user = await handleApiRequest<User | null>(
      axiosInstance.get("/users/me")
    );

    return user;
  } catch {
    return null;
  }
};

export const createUser = async ({
  name,
  email,
  id,
}: {
  name: string;
  email: string;
  id: string;
}) => {
  try {
    const user = await handleApiRequest<User | null>(
      axiosInstance.post("/users", {
        name,
        email,
        firebase_uid: id,
      })
    );

    return user;
  } catch {
    return null;
  }
};

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<User | null> => {
  try {
    const updatedUser = await handleApiRequest<User | null>(
      axiosInstance.put(`/users/${userId}`, data)
    );

    return updatedUser;
  } catch {
    return null;
  }
};
