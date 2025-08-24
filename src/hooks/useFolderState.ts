"use client";

import { useCallback } from "react";
import { useQueryState } from "nuqs";

export function useFolderState(initialCampaignId?: string) {
  // URL state management for campaign selection
  const [selectedCampaignFromUrl, setSelectedCampaignFromUrl] = useQueryState(
    "campaign",
    {
      defaultValue: initialCampaignId || "",
    }
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
    selectedCampaignFromUrl,
    handleCampaignSelect,
    handleBackToCampaigns,
  };
}
