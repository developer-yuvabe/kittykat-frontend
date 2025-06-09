import { handleApiRequest } from "@/lib/utils";
import axiosInstance from "@/config/axios/api-server.config";
import { User } from "@/types/user.types";

export const fetchUser = async () => {
  try {
    const user = await handleApiRequest<User | null>(
      axiosInstance.get("/users/me")
    );

    return {
      error: null,
      user,
    };
  } catch {
    return {
      error: "Failed to fetch user",
      user: null,
    };
  }
};

export const fetchUserInvitation = async (invitationId: string) => {
  try {
    const invitation = await handleApiRequest<User>(
      axiosInstance.get(`/invitations/${invitationId}`)
    );

    return invitation;
  } catch {
    return null;
  }
};
