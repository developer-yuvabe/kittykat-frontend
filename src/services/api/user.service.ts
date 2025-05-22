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

import { handleApiRequest } from "@/lib/utils";

import axios from "axios";
import {
  PresignedURLRequest,
  UserCreate,
  UserResponse,
  UsersListResponse,
  UserUpdate,
  UserWithRole,
} from "@/types/user.types";

class UserService {
  async createUser(request: UserCreate): Promise<UserResponse> {
    return handleApiRequest<UserResponse>(
      axiosInstance.post("/users", request)
    );
  }

  async getCurrentUser(): Promise<UserWithRole> {
    return handleApiRequest<UserWithRole>(axiosInstance.get("/users/me"));
  }

  async searchUsers(query: string): Promise<UserResponse[]> {
    return handleApiRequest<UserResponse[]>(
      axiosInstance.get("/users/search", {
        params: { query },
      })
    );
  }

  async getUsersByRole(
    role_id: string,
    skip = 0,
    limit = 10
  ): Promise<UsersListResponse> {
    return handleApiRequest<UsersListResponse>(
      axiosInstance.get(`/users/role/${role_id}`, {
        params: { skip, limit },
      })
    );
  }

  async getUsersByBrand(
    brand_id: string,
    skip = 0,
    limit = 10
  ): Promise<UsersListResponse> {
    return handleApiRequest<UsersListResponse>(
      axiosInstance.get(`/users/brand/${brand_id}`, {
        params: { skip, limit },
      })
    );
  }

  async getUserById(user_id: string): Promise<UserResponse> {
    return handleApiRequest<UserResponse>(
      axiosInstance.get(`/users/${user_id}`)
    );
  }

  async getAllUsers(skip = 0, limit = 10): Promise<UsersListResponse> {
    return handleApiRequest<UsersListResponse>(
      axiosInstance.get("/users", {
        params: { skip, limit },
      })
    );
  }

  async updateUser(
    user_id: string,
    userUpdate: UserUpdate
  ): Promise<UserResponse> {
    return handleApiRequest<UserResponse>(
      axiosInstance.put(`/users/${user_id}`, userUpdate)
    );
  }

  async deleteUser(user_id: string): Promise<{ id: string }> {
    return handleApiRequest<{ id: string }>(
      axiosInstance.delete(`/users/${user_id}`)
    );
  }

  async generatePresignedUrls(
    thread_id: string,
    fileName: string,
    contentType: string
  ): Promise<{ upload_url: string; download_url: string }> {
    const requestData: PresignedURLRequest = {
      file_name: fileName,
      content_type: contentType,
    };

    return handleApiRequest<{ upload_url: string; download_url: string }>(
      axiosInstance.post(`/users/thread/${thread_id}/file/upload`, requestData)
    );
  }

  async uploadFileWithPresignedUrl(
    thread_id: string,
    fileName: string,
    fileType: string,
    file: File
  ): Promise<string> {
    try {
      // Get the presigned URLs
      const response = await this.generatePresignedUrls(
        thread_id,
        fileName,
        fileType
      );
      const { upload_url, download_url } = response;

      // Upload the file to the presigned URL
      await axios.put(upload_url, file, {
        headers: {
          "Content-Type": fileType,
        },
      });

      // Return the download URL
      return download_url;
    } catch (error) {
      console.error("Error in uploadFileWithPresignedUrl:", error);
      throw new Error("File upload failed. Please try again.");
    }
  }
}

export const userService = new UserService();
