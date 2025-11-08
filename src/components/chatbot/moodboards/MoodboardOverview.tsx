import {
  capitalizeKey,
  formatUpdateMessage,
  normalizeJsonToString,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Agents } from "@/types/types";
import React from "react";
import { DisplayField } from "../DisplayField";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";

interface MoodboardOverviewOverviewProps {
  title?: string;
  description?: string;
  tone?: string[];
  campaignId?: string;
}

export const MoodboardOverview: React.FC<MoodboardOverviewOverviewProps> = ({
  title,
  description,
  tone = [],
}) => {
  const stream = useStreamContext();
  const { selectedImageGenerationModel } = useModelsStore();
  const { user } = useUserStore();
  const { selectedBrandId, selectedCampaignId, selectedMoodboardId } =
    useBrandStore();

  const handleFieldUpdate = async (
    fieldPath: string,
    oldValue: any,
    newVal: any,
    label?: string
  ) => {
    const msg = formatUpdateMessage(
      fieldPath,
      normalizeJsonToString(oldValue),
      normalizeJsonToString(newVal),
      Agents.BRANDING_AGENT,
      label ??
        fieldPath
          .split(".")
          .pop()
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
    );

    if (msg) {
      submitOptimisticMessage({
        stream,
        text: msg,
        userId: user!.id,
        currentBrandContextId: selectedBrandId,
        currentCampaignId: selectedCampaignId,
        currentMoodboardId: selectedMoodboardId,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
      });
    }
  };

  return (
    <DisplayField
      json={{
        description: description,
        tone: tone,
      }}
      title={`Campaign Concept: “${title}”`}
      agentId={Agents.CAMPAIGN_AGENT}
      onValueChange={(key, oldValue, newValue) => {
        handleFieldUpdate(
          `campaign.${key}`,
          oldValue,
          newValue,
          `Campaign ${capitalizeKey(key)}`
        );
      }}
    />
  );
};
