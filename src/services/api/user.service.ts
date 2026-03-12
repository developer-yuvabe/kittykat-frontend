import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { invitationSchema } from "@/schema/inviation.schema";
import { PaginationMeta } from "@/types/types";
import {
  TokenUsageCsvParams,
  User,
  UserBrand,
  UserListItem,
  UserListResponse,
} from "@/types/user.types";
import { z } from "zod";

export const createUser = async (userData: {
  uid: string;
  email: string;
  name: string;
}) => {
  try {
    const updatedUser = await handleApiRequest<UserListItem>(
      axiosInstance.post(`/users`, userData),
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  userData: Pick<User, "thread_id"> & {
    name?: string;
    roleId?: string;
    brand_access?: string[];
    model_access?: string[];
    contentFilterDisabled?: boolean;
    credits?: number;
    tokens?: number;
    user_preferences?: {
      enhance_prompts?: boolean;
    };
  },
): Promise<UserListItem> => {
  try {
    const fieldsToUpdate = {
      name: userData.name,
      role_id: userData.roleId,
      thread_id: userData.thread_id,
      brand_access: userData.brand_access,
      model_access: userData.model_access,
      content_filter_disabled: userData.contentFilterDisabled,
      credits: userData.credits,
      tokens: userData.tokens,
      user_preferences: userData.user_preferences,
    };

    const updatedUser = await handleApiRequest<UserListItem>(
      axiosInstance.put(`/users/${userId}`, fieldsToUpdate),
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
  searchQuery?: string,
  workspaceIds?: string[]
): Promise<UserListResponse | null> => {
  try {
    const skip = (page - 1) * limit;

    const data = await handleApiRequest<{
      users: UserListItem[];
      pagination: PaginationMeta;
    } | null>(
      axiosInstance.get(`/users`, {
        params: {
          skip,
          limit,
          ...(searchQuery && { search: searchQuery }),
          ...(workspaceIds?.length && { workspace_ids: workspaceIds }),
        },
      })
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
  userId: string,
): Promise<UserBrand[] | null> => {
  try {
    const data = await handleApiRequest<UserBrand[] | null>(
      axiosInstance.get(`/users/${userId}/brands`),
    );
    return data;
  } catch {
    return [];
  }
};

export const resetUserThread = async (
  userId: string,
): Promise<UserListItem> => {
  try {
    const data = await handleApiRequest<UserListItem>(
      axiosInstance.patch(`/users/${userId}/reset-thread`),
    );
    return data;
  } catch (error) {
    console.error("Error resetting user thread:", error);
    throw error;
  }
};

export const updateUserActiveTeam = async (
  userId: string,
  active_team_id: string | null,
): Promise<UserListItem> => {
  try {
    const data = await handleApiRequest<UserListItem>(
      axiosInstance.patch(`/users/${userId}/active-team`, {
        active_team_id,
      }),
    );

    return data;
  } catch (error) {
    console.error("Error updating user active team:", error);
    throw error;
  }
};

export const inviteUser = async (data: z.infer<typeof invitationSchema>) => {
  try {
    const response = await handleApiRequest<UserListItem>(
      axiosInstance.post("/invitations", {
        email: data.email,
        role: data.role,
        model_access: data.modelAccess,
        base_url: window.location.origin,
        content_filter_disabled: data.contentFilterDisabled,
        credits: data.credits,
        tokens: data.tokens,
        team_id: data.teamId,
        team_role: data.teamRole,
      }),
    );

    if (!response) {
      throw new Error("Failed to invite user");
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const resendInvitation = async (invitationId: string) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/invitations/${invitationId}/resend`),
    );
  } catch (error) {
    console.error("Error resending invitation:", error);
    throw error;
  }
};

export const acceptInvitation = async (
  invitationId: string,
  firebase_uid: string,
  name: string,
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/invitations/${invitationId}/accept`, {
        name,
        firebase_uid,
      }),
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
      }),
    );

    return response.exists === true;
  } catch (error) {
    console.error("Email check failed:", error);
    return false; // fail safe
  }
};

export const sendEmailVerificationLink = async (email: string) => {
  try {
    await handleApiRequest(
      axiosInstance.post("/users/email-verification", {
        email,
        base_url: `${window.location.origin}`,
      }),
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};


export const exportTokenUsageCsv = async (
  params: TokenUsageCsvParams
): Promise<Blob> => {
  const response = await axiosInstance.post(
    "/users/token-usage/export/excel",
    null,
    { params, responseType: "blob", paramsSerializer: { indexes: null } }
  );
  return response.data;
};