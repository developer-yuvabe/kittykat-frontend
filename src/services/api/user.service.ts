import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { inviationSchema } from "@/schema/inviation.schema";
import { PaginationMeta } from "@/types/types";
import { User, UserBrand, UserListItem } from "@/types/user.types";
import { z } from "zod";

export const updateUser = async (
  userId: string,
  userData: Pick<User, "thread_id"> & {
    roleId?: string;
    brand_access?: string[];
  }
): Promise<User | null> => {
  try {
    const fieldsToUpdate = {
      role_id: userData.roleId,
      thread_id: userData.thread_id,
      brand_access: userData.brand_access,
    };

    const updatedUser = await handleApiRequest<User | null>(
      axiosInstance.put(`/users/${userId}`, fieldsToUpdate)
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const fetchAllUsers = async (
  page: number,
  limit: number,
  searchQuery?: string
): Promise<{
  users: UserListItem[];
  pagination: PaginationMeta;
} | null> => {
  try {
    const skip = (page - 1) * limit;

    const data = await handleApiRequest<{
      users: UserListItem[];
      pagination: PaginationMeta;
    } | null>(
      axiosInstance.get(
        `${searchQuery ? `/users?search=${searchQuery}` : `/users`}`,
        {
          params: { skip, limit },
        }
      )
    );

    return data;
  } catch {
    return null;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    await handleApiRequest(axiosInstance.delete(`/users/${userId}`));
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const fetchUserBrands = async (
  userId: string
): Promise<UserBrand[] | null> => {
  try {
    const data = await handleApiRequest<UserBrand[] | null>(
      axiosInstance.get(`/users/${userId}/brands`)
    );
    return data;
  } catch (e) {
    return [];
  }
};

export const inviteUser = async (data: z.infer<typeof inviationSchema>) => {
  try {
    const response = await handleApiRequest<User | null>(
      axiosInstance.post("/invitations", {
        email: data.email,
        role: data.role,
        brand_access: data.brandAccess,
        base_url: window.location.origin,
      })
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const resendInvitation = async (invitationId: string) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/invitations/${invitationId}/resend`)
    );
  } catch (error) {
    console.error("Error resending invitation:", error);
    throw error;
  }
};

export const acceptInvitation = async (
  invitationId: string,
  firebase_uid: string,
  name: string
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/invitations/${invitationId}/accept`, {
        name,
        firebase_uid,
      })
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw error;
  }
};

export const checkIfEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await handleApiRequest<{
      exists: boolean;
    }>(
      axiosInstance.get("/users/check", {
        params: { email },
      })
    );

    return response.exists === true;
  } catch (error) {
    console.error("Email check failed:", error);
    return false; // fail safe
  }
};
