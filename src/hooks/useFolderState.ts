"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState } from "nuqs";
import type { BrandCampaignListResponse } from "@/types/gallery.types";

export function useFolderState(
  initialCampaignId?: string,
  brands: BrandCampaignListResponse["brands"] = [],
  brandsLoading: boolean = false
) {
  // Local state for selected brand
  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);

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
      setSelectedBrand(brands[0]);
    }
  }, [brands, brandsLoading, selectedBrand]);

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
    },
    [setSelectedCampaignFromUrl]
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
