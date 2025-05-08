// src/services/brand.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import {
  BrandIdentity,
  BrandResponse,
  BrandsListResponse,
  BrandURLRequest,
} from "@/types/brand.types";

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

  async searchBrands(query: string): Promise<BrandResponse[]> {
    return handleApiRequest<BrandResponse[]>(
      axiosInstance.get("/brands/search", {
        params: { query },
      })
    );
  }
}

export const brandService = new BrandService();
