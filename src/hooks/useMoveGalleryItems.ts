import { useState } from "react";
import { toast } from "sonner";
import type { GalleryActions } from "./useGallery";
import type { GalleryItemResponse } from "@/types/gallery.types";

export type MoveAction = "brand" | "campaign" | "source" | "archive";

export interface MoveOptions {
  targetBrandId?: string;
  targetCampaignId?: string | null;
  targetSource?: string;
  isArchived?: boolean;
}

export interface BrandWithCampaigns {
  id: string;
  name: string;
  campaigns: Array<{ id: string; title: string }>;
}

/**
 * Shared hook for moving gallery items between campaigns, brands, sources, and archive states.
 * This centralizes the move logic used by both MediaBulkActions and drag-and-drop operations.
 */
export function useMoveGalleryItems(
  galleryActions: GalleryActions,
  brands: BrandWithCampaigns[]
) {
  const [isMoving, setIsMoving] = useState(false);

  /**
   * Move gallery items with the specified options
   * @param items - Array of gallery items to move
   * @param action - Type of move action (brand, campaign, source, archive)
   * @param options - Move options (target IDs, archive state, etc.)
   * @param onSuccess - Optional callback to run on successful move
   */
  const moveItems = async (
    items: GalleryItemResponse[],
    action: MoveAction,
    options: MoveOptions,
    onSuccess?: () => void
  ) => {
    if (items.length === 0) {
      return;
    }

    setIsMoving(true);
    try {
      const updateData: any = {};

      if (action === "brand" && options.targetBrandId) {
        updateData.brand_id = options.targetBrandId;
        // When moving to a different brand, remove campaign assignment
        updateData.campaign_id = null;
      } else if (action === "campaign") {
        if (
          options.targetCampaignId === null ||
          options.targetCampaignId === "none"
        ) {
          updateData.campaign_id = null;
        } else if (options.targetCampaignId) {
          updateData.campaign_id = options.targetCampaignId;
          // When moving to a campaign, also update the brand to match the campaign's brand
          const campaignWithBrand = brands.find((brand) =>
            brand.campaigns.some((camp) => camp.id === options.targetCampaignId)
          );
          if (campaignWithBrand) {
            updateData.brand_id = campaignWithBrand.id;
          }
        }
      } else if (action === "source" && options.targetSource) {
        updateData.asset_source = options.targetSource;
      } else if (action === "archive") {
        updateData.is_archived = options.isArchived ?? false;
      }

      // Execute the patch operations
      await Promise.all(
        items.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: updateData,
          })
        )
      );

      // Success toast notification
      const getMovementDescription = () => {
        if (action === "brand" && options.targetBrandId) {
          const targetBrand = brands.find(
            (b) => b.id === options.targetBrandId
          );
          return `to brand "${targetBrand?.name}"`;
        } else if (action === "campaign") {
          if (
            options.targetCampaignId === null ||
            options.targetCampaignId === "none"
          ) {
            return "and removed from campaigns";
          }
          // Find the campaign in any brand
          let targetCampaignTitle = "";
          brands.forEach((brand) => {
            const campaign = brand.campaigns.find(
              (c) => c.id === options.targetCampaignId
            );
            if (campaign) {
              targetCampaignTitle = campaign.title;
            }
          });
          return `to campaign "${targetCampaignTitle}"`;
        } else if (action === "source" && options.targetSource) {
          const sourceMap: Record<string, string> = {
            "brand-uploads": "Brand Uploads",
            "showboard-media": "Concept Visuals",
            "a2i-media": "A2I Media",
            moodboard: "Moodboard",
          };
          return `to ${
            sourceMap[options.targetSource] || options.targetSource
          }`;
        } else if (action === "archive") {
          return options.isArchived ? "to Archived" : "to Active";
        }
        return "";
      };

      toast.success(
        `Successfully moved ${items.length} item(s) ${getMovementDescription()}`
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Failed to move assets. Please try again.");
      throw error; // Re-throw to allow caller to handle if needed
    } finally {
      setIsMoving(false);
    }
  };

  return {
    moveItems,
    isMoving,
  };
}
