// src/services/brand.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  BrandIdentity,
  BrandResponse,
  BrandsListResponse,
  BrandURLRequest,
} from "@/types/brand.types";
import axios from "axios";

class BrandService {
  async createBrand(request: BrandIdentity): Promise<BrandResponse> {
    return handleApiRequest<BrandResponse>(
      axiosInstance.post("/brands", request)
    );
  }

  async getAllBrands(skip = 0, limit = 10): Promise<BrandsListResponse> {
    return handleApiRequest<BrandsListResponse>(
      axiosInstance.get("/brands", {
        params: { skip, limit },
      })
    );
  }

  async getBrandById(brand_id: string): Promise<BrandResponse> {
    return handleApiRequest<BrandResponse>(
      axiosInstance.get(`/brands/${brand_id}`)
    );
  }

  async updateBrand(
    brand_id: string,
    brandUpdate: BrandIdentity
  ): Promise<BrandResponse> {
    return handleApiRequest<BrandResponse>(
      axiosInstance.put(`/brands/${brand_id}`, brandUpdate)
    );
  }

  async deleteBrand(brand_id: string): Promise<{ id: string }> {
    return handleApiRequest<{ id: string }>(
      axiosInstance.delete(`/brands/${brand_id}`)
    );
  }

  async extractBrandDataFromUrl(
    request: BrandURLRequest
  ): Promise<BrandIdentity> {
    return handleApiRequest<BrandIdentity>(
      axiosInstance.post("/brands/extract-brand", request)
    );
  }

  async uploadFileAndReturnUrl(
    prefix: string,
    fileName: string,
    fileType: string,
    file: File
  ): Promise<string> {
    try {
      // Get the presigned URL
      const response = await axiosInstance.post(
        `/users/thread/${prefix}/file/upload`,
        {
          file_name: fileName,
          content_type: fileType,
        }
      );
      const { upload_url, download_url } = response.data.data;

      // Upload the file to the presigned URL
      await axios.put(upload_url, file, {
        headers: {
          "Content-Type": fileType,
        },
      });

      // Return the final file URL without query parameters
      return download_url;
    } catch (error) {
      console.error("Error in uploadFileAndReturnUrl:", error);
      throw new Error("File upload failed. Please try again.");
    }
  }
}

export const brandService = new BrandService();
