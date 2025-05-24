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
}

export async function updateCampaignMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string,
  moodboardData: Record<string, unknown>
): Promise<BrandResponse> {
  return handleApiRequest<BrandResponse>(
    axiosInstance.put(`/brands/moodboard/${moodboardId}`, {
      brand_id: brandId,
      campaign_id: campaignId,
      ...moodboardData,
    })
  );
}

export async function deleteCampaignMoodboard(
  brandId: string,
  campaignId: string,
  moodboardId: string
): Promise<BrandResponse> {
  return handleApiRequest<BrandResponse>(
    axiosInstance.delete(`/brands/moodboard/${moodboardId}`, {
      data: { brand_id: brandId, campaign_id: campaignId },
    })
  );
}

export const brandService = new BrandService();
