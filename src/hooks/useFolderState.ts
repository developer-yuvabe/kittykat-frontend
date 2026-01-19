"use client";

import { useCallback } from "react";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { updateCurrentContextBrandId } from "@/services/api/langgraph.service";

export function useFolderState(isDialog = false) {
  const {
    selectedCampaignId,
    setSelectedCampaignId,
    dialogCampaignId,
    setDialogCampaignId,
    selectedBrandId,
  } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  // Use dialog campaign ID when in dialog mode, otherwise use regular campaign ID
  const activeCampaignId = isDialog ? dialogCampaignId : selectedCampaignId;
  const setActiveCampaignId = isDialog ? setDialogCampaignId : setSelectedCampaignId;

  const handleCampaignSelect = useCallback(
    (campaignId: string) => {
      // 🔁 Toggle off if same campaign is clicked again
      if (campaignId === activeCampaignId) {
        setActiveCampaignId(null);
        return;
      }

      // Empty string means deselect
      if (!campaignId) {
        setActiveCampaignId(null);
        return;
      }

      setActiveCampaignId(campaignId);

      // Update thread context if available (only for non-dialog mode)
      if (!isDialog && user?.thread_id && selectedBrandId) {
        updateCurrentContextBrandId(
          user.thread_id,
          selectedBrandId,
          stream.values.currentBrandContextId
        );
      }
    },
    [
      activeCampaignId,
      setActiveCampaignId,
      isDialog,
      user?.thread_id,
      selectedBrandId,
      stream.values.currentBrandContextId,
    ]
  );

  const handleBackToCampaigns = useCallback(() => {
    setActiveCampaignId(null);
  }, [setActiveCampaignId]);

  return {
    selectedCampaignId: activeCampaignId,
    handleCampaignSelect,
    handleBackToCampaigns,
  };
}
