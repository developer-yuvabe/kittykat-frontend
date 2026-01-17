import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, CirclePlus, Megaphone } from "lucide-react";
import { Agents, ThreadCampaign, ThreadDetails } from "@/types/types";
import { CampaignColors } from "./CampaignColors";
import CampaignSelector from "./CampaignSelector";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { AnimatePresence, motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import {
  capitalizeKey,
  formatUpdateMessage,
  normalizeJsonToString,
} from "@/lib/langgraph.utils";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { DisplayField } from "../DisplayField";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";
import { useThreadStore } from "@/store/thread.store";
import { popVariants } from "@/lib/motion.utils";
import { AppConfig } from "@/config/app.config";

export const CampaignSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  currentCampaign: ThreadCampaign | null;
}> = ({ campaignInformation, currentCampaign }) => {
  const [expanded, setExpanded] = useState(
    AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW
  );

  const {
    selectedBrandId,
    selectedCampaignId,
    selectedMoodboardId,
    setIsCampaignCreating,
  } = useBrandStore();
  const { user } = useUserStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const { chatOnlyMode } = useThreadStore();
  const stream = useStreamContext();

  const [fadeKey, setFadeKey] = useState(0);

  // Create a ref for the CampaignOverview component
  const campaignOverviewRef = React.useRef<HTMLDivElement>(null);

  // All useEffect hooks
  useEffect(() => {
    setFadeKey((prev) => prev + 1);
  }, [currentCampaign?.id]);

  // Enhanced function to handle new campaign creation with scroll
  const handleViaAgent = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      try {
        // Set creating campaign state
        setIsCampaignCreating(true);

        // Submit the message
        if (user) {
          submitOptimisticMessage({
            stream,
            text: `Let's create a new campaign!`,
            userId: user.id,
            chatOnlyMode,
            currentBrandContextId: selectedBrandId,
            currentCampaignId: selectedCampaignId,
            currentMoodboardId: selectedMoodboardId,
            currentSelectedImageGenerationModelId:
              selectedImageGenerationModel?.id ?? null,
            currentSelectedVideoGenerationModelId:
              selectedVideoGenearationModel?.id ?? null,
            userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
            activeTeamId: user!.active_team_id!,
          });
        }
      } catch (error) {
        console.error("Error creating new campaign:", error);
      }
    },
    [user, stream, selectedBrandId, setIsCampaignCreating]
  );

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
      Agents.CAMPAIGN_AGENT,
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
        chatOnlyMode,
        currentBrandContextId: selectedBrandId,
        currentCampaignId: selectedCampaignId,
        currentMoodboardId: selectedMoodboardId,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        currentSelectedVideoGenerationModelId:
          selectedVideoGenearationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        activeTeamId: user!.active_team_id!,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-x-4 items-center">
          <Button
            variant="outline"
            size="icon"
            className={
              expanded
                ? "rotate-90 transition-transform"
                : "transition-transform"
            }
            onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
          >
            {<ChevronRight />}
          </Button>
          <div className="w-14 h-14 rounded-lg bg-brand-gradient text-white flex items-center justify-center">
            <Megaphone />
          </div>
          <div>
            <h4 className="font-light text-sm">Campaign</h4>

            <DisplayField
              key={currentCampaign?.campaign?.title}
              json={{
                Campaign: `${
                  currentCampaign?.campaign?.title || "Unnamed Campaign"
                }`,
              }}
              agentId={Agents.CAMPAIGN_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  "campaign.title",
                  oldValue,
                  newValue,
                  "Campaign Title"
                );
              }}
              textClassName="font-bold text-2xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          <div>
            <CampaignSelector campaigns={campaignInformation || []} />
          </div>
          <TooltipIconButton
            size="lg"
            className="p-4"
            tooltip="New Campaign"
            variant="ghost"
            onClick={handleViaAgent}
          >
            <CirclePlus className="size-5" />
          </TooltipIconButton>
        </div>
      </div>

      {expanded && (
        <AnimatePresence>
          <motion.div
            initial="collapsed"
            animate="open"
            className="overflow-hidden"
            exit="collapsed"
            variants={popVariants}
          >
            {/* Existing campaign content */}
            {currentCampaign && (
              <motion.div
                key={fadeKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-2 gap-6"
                ref={campaignOverviewRef}
              >
                <DisplayField
                  json={{
                    description: currentCampaign?.campaign?.description,
                    tone: currentCampaign?.campaign?.tone,
                  }}
                  title={`Campaign Concept: “${currentCampaign?.campaign?.title}”`}
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
                <CampaignColors
                  colors={currentCampaign?.colors || []}
                  campaignId={currentCampaign.id}
                  campaignTitle={currentCampaign.campaign?.title}
                />

                <DisplayField
                  json={{
                    target_audience: currentCampaign.target_audience,
                  }}
                  title={`Target Audience`}
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

                <DisplayField
                  json={{
                    ...(currentCampaign.content_campaign_ideas ?? {}),
                  }}
                  title={`Content Campaign Ideas`}
                  agentId={Agents.CAMPAIGN_AGENT}
                  onValueChange={(key, oldValue, newValue) => {
                    handleFieldUpdate(
                      `campaign.${key}`,
                      oldValue,
                      newValue,
                      `Campaign ${capitalizeKey(key)}`
                    );
                  }}
                  showKeyAsLabel
                />

                {Object.keys(currentCampaign.dynamic || {}).length === 0 && (
                  <div className="text-sm italic text-gray-400">
                    No dynamic details available.
                  </div>
                )}

                {Object.keys(currentCampaign.dynamic || {}).map((key) => (
                  <DisplayField
                    key={key}
                    json={{
                      [key]: currentCampaign.dynamic
                        ? currentCampaign.dynamic[key]
                        : null,
                    }}
                    title={capitalizeKey(key)}
                    agentId={Agents.CAMPAIGN_AGENT}
                    onValueChange={(subKey, oldValue, newValue) => {
                      handleFieldUpdate(
                        `dynamic.${key}`,
                        oldValue,
                        newValue,
                        `Brand ${capitalizeKey(key)}`
                      );
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
