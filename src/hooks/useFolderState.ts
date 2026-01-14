"use client";

import { useCallback } from "react";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { updateCurrentContextBrandId } from "@/services/api/langgraph.service";

export function useFolderState() {
  const {
    selectedCampaignIdInGallery: selectedCampaignId,
    setSelectedCampaignIdInGallery: setSelectedCampaignId,
    selectedBrandId,
  } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  const handleCampaignSelect = useCallback(
    (campaignId: string) => {
      // 🔁 Toggle off if same campaign is clicked again
      if (campaignId === selectedCampaignId) {
        setSelectedCampaignId(null);
        return;
      }

      // Empty string means deselect
      if (!campaignId) {
        setSelectedCampaignId(null);
        return;
      }

      setSelectedCampaignId(campaignId);

      // Update thread context if available
      if (user?.thread_id && selectedBrandId) {
        updateCurrentContextBrandId(
          user.thread_id,
          selectedBrandId,
          stream.values.currentBrandContextId
        );
      }
    },
    [
      selectedCampaignId,
      setSelectedCampaignId,
      user?.thread_id,
      selectedBrandId,
      stream.values.currentBrandContextId,
    ]
  );

  const handleBackToCampaigns = useCallback(() => {
    setSelectedCampaignId(null);
  }, [setSelectedCampaignId]);

  return {
    selectedCampaignId,
    handleCampaignSelect,
    handleBackToCampaigns,
  };
}
