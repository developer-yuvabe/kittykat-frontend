import axiosInstance from "@/config/axios/api-client.config";
import axios from "axios";

export async function uploadFileAndReturnUrl(
  fileName: string,
  fileType: string,
  contentSource: string,
  file: File,
  brandId?: string | null,
  campaignId?: string | null
): Promise<string> {
  try {
    // Clean the file name: trim spaces and remove extension
    const cleanedFileName = fileName
      .trim()
      .replace(/\s+/g, "_") // replace internal spaces with underscores
      .replace(/\.[^/.]+$/, ""); // remove file extension

    // Get the presigned URL

    const response = await axiosInstance.post(`/users/file/upload`, {
      file_name: cleanedFileName,
      content_type: fileType,
      content_source: contentSource,
      brand_id: brandId || null, // Use brandId if provided, otherwise null
      campaign_id: campaignId || null, // Use campaignId if provided, otherwise null
    });

    const { upload_url, download_url } = response.data.data;

    // Upload the file to the presigned URL
    await axios.put(upload_url, file, {
      headers: {
        "Content-Type": fileType,
      },
    });

    // Return the final file URL
    return download_url;
  } catch (error) {
    console.error("Error in uploadFileAndReturnUrl:", error);
    throw new Error("File upload failed. Please try again.");
  }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    // Get the presigned URL for deletion
    await axiosInstance.delete(`/users/file/delete`, {
      data: {
        url,
      },
    });
  } catch (error) {
    console.error("Error occured in deleting file:", error);
  }
}
