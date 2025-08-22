"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState } from "nuqs";
import type { BrandCampaignListResponse } from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";

export function useFolderState(
  initialCampaignId?: string,
  brands: BrandCampaignListResponse["brands"] = [],
  brandsLoading: boolean = false,
  selectedBrandId?: string
) {
  // Local state for selected brand
  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);
  const { user } = useUserStore();

  const stream = useStreamContext();

  const { setSelectedBrandId } = useBrandStore();
  // URL state management for campaign selection
  const [selectedCampaignFromUrl, setSelectedCampaignFromUrl] = useQueryState(
    "campaign",
    {
      defaultValue: initialCampaignId || "",
    }
  );

  // Auto-select first brand when brands are loaded
  useEffect(() => {
    if (!brandsLoading && brands.length > 0 && !selectedBrand) {
      let brandToSelect;
      if (selectedBrandId) {
        brandToSelect = brands.find((b) => b.brand_id === selectedBrandId);
      } else {
        brandToSelect = brands[0];
      }

      if (brandToSelect) {
        setSelectedBrand(brandToSelect);
        setSelectedBrandId(brandToSelect.brand_id);

        // Update stream context
        if (user?.thread_id) {
          stream.client.threads.updateState(user?.thread_id, {
            values: {
              currentBrandContextId: brandToSelect.brand_id,
              previousBrandContextId: stream.values.currentBrandContextId,
            },
          });
        }
      }
    }
  }, [
    brands,
    brandsLoading,
    selectedBrand,
    selectedBrandId,
    setSelectedBrandId,
    user?.thread_id,
    stream,
  ]);

  // Reset campaign selection when brand changes
  useEffect(() => {
    if (selectedBrand) {
      // Check if current campaign exists in new brand
      const campaignExists = selectedBrand.campaigns.some(
        (c) => c.id === selectedCampaignFromUrl
      );

      if (!campaignExists && selectedCampaignFromUrl) {
        // Clear campaign selection if it doesn't exist in the new brand
        setSelectedCampaignFromUrl(null);
      }
    } else {
      // Clear campaign selection if no brand is selected
      setSelectedCampaignFromUrl(null);
    }
  }, [selectedBrand, selectedCampaignFromUrl, setSelectedCampaignFromUrl]);

  const handleBrandChange = useCallback(
    (brand: BrandCampaignListResponse["brands"][number] | null) => {
      setSelectedBrand(brand);
      // Clear campaign selection when brand changes
      setSelectedCampaignFromUrl("");

      // Update stream context when brand changes
      if (brand && user?.thread_id) {
        stream.client.threads.updateState(user?.thread_id, {
          values: {
            currentBrandContextId: brand.brand_id,
            previousBrandContextId: stream.values.currentBrandContextId,
          },
        });
      }
    },
    [setSelectedCampaignFromUrl, user?.thread_id, stream]
  );

  const handleCampaignSelect = useCallback(
    (campaignId: string) => {
      setSelectedCampaignFromUrl(campaignId);
    },
    [setSelectedCampaignFromUrl]
  );

  const handleBackToCampaigns = useCallback(() => {
    setSelectedCampaignFromUrl("");
  }, [setSelectedCampaignFromUrl]);

  return {
    selectedBrand,
    selectedCampaignFromUrl,
    handleBrandChange,
    handleCampaignSelect,
    handleBackToCampaigns,
  };
}
