import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { MoodboardAsset } from "@/types/types";
import { z, ZodTypeAny } from "zod";

export const generateImage = async <T extends ZodTypeAny>(
  brandId: string,
  data: z.infer<T>
) => {
  try {
    await handleApiRequest(
      axiosInstance.post(`/brands/${brandId}/a2i/image-generation`, {
        ...data,
      })
    );
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const deleteA2iImage = async (
  brandId: string,
  generationId: string,
  imageId: string | null
) => {
  try {
    await handleApiRequest(
      axiosInstance.delete(`/brands/${brandId}/a2i/images`, {
        data: {
          generation_id: generationId,
          image_id: imageId,
        },
      })
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const toggleA2iImageLike = async (
  brandId: string,
  generationId: string,
  imageId: string,
  isLiked: boolean
) => {
  try {
    await handleApiRequest(
      axiosInstance.put(`/brands/${brandId}/a2i/images`, {
        generation_id: generationId,
        image_id: imageId,
        is_liked: isLiked,
      })
    );
  } catch (error) {
    console.error("Error toggling image like status:", error);
    throw error;
  }
};

export const updateA2iImagePositions = async (
  brandId: string,
  updates: {
    generation_id: string;
    image_id: string;
    position: number;
  }[]
) => {
  try {
    await handleApiRequest(
      axiosInstance.put(`/brands/${brandId}/a2i/images/positions`, {
        updates,
      })
    );
  } catch (error) {
    console.error("Failed to update image positions:", error);
    throw error;
  }
};

export const updateA2iRefernceMoodboard = async (
  brandId: string,
  moodboardId: string | null,
  referenceMoodboardAssets?: MoodboardAsset[]
) => {
  try {
    await handleApiRequest(
      axiosInstance.patch(`/brands/a2i/reference-moodboard`, {
        moodboard_id: moodboardId,
        brand_id: brandId,
        reference_moodboard_assets: referenceMoodboardAssets,
      })
    );
  } catch (error) {
    console.error("Error updating reference moodboard:", error);
    throw error;
  }
};

// Product Extraction Types
export interface ProductExtractionRequest {
  image_ids: string[];
  products: string[];
}

export interface ProductAttributes {
  product_type: string;
  product_name_candidate: string;
  color: string;
  material: string;
  pattern: string | null;
  view_angle: string;
  variant_notes: string;
}

export interface DetectionInfo {
  description: string;
  position: string;
}

export interface ExtractedProduct {
  attributes: ProductAttributes;
  generated_name: string;
  detection_info: DetectionInfo | null;
  extracted_image_url: string;
}

export interface ImageResult {
  source_image_url: string;
  success: boolean;
  detection_result: {
    has_product: boolean;
    product_count: number;
    is_multi_product: boolean;
    products: Array<{
      description: string;
      position: string;
    }>;
    confidence: string;
    reason: string;
  };
  extracted_products: ExtractedProduct[];
}

export interface ProductExtractionResponse {
  message: string;
  queue_item_id: string;
  message_ids: string[];
  total_images: number;
  brand_id: string;
}

export const extractProducts = async (
  brandId: string,
  data: ProductExtractionRequest
): Promise<ProductExtractionResponse> => {
  try {
    const response = await handleApiRequest<ProductExtractionResponse>(
      axiosInstance.post(`/brands/${brandId}/a2i/product-extraction`, data)
    );
    return response;
  } catch (error) {
    console.error("Error extracting products:", error);
    throw error;
  }
};
