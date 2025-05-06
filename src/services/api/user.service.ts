import axiosInstance from "@/config/axios/api-server.config";
import { User } from "@/types/types";

export const fetchUser = async () => {
  try {
    const response = await axiosInstance.get("/users/me");
    return response.data.data as User;
  } catch (error) {
    console.error(error);
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
    const response = await axiosInstance.post("/users", {
      name,
      email,
      firebase_uid: id,
    });
    return response.data.data as User;
  } catch (error) {
    console.error(error);
    return null;
  }
};
