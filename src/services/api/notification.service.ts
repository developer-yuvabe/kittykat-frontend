import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { BrandNotificationGroup } from "@/types/notification.types";

export const getUserNotifications = async (): Promise<
  BrandNotificationGroup[]
> => {
  try {
    return await handleApiRequest<BrandNotificationGroup[]>(
      axiosInstance.get(`/notifications`)
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationsAsRead = async (
  brandId: string,
  galleryItemId: string
) => {
  try {
    return await handleApiRequest(
      axiosInstance.put(`/notifications`, {
        brand_id: brandId,
        gallery_id: galleryItemId,
      })
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};
