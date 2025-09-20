import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  MegaphoneIcon,
} from "lucide-react";
import { Agents, ThreadDetails } from "@/types/types";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  campaignFields,
  moodboardFields,
  PlaceholderSection,
} from "../brands/InitialPlaceHolder";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { toast } from "sonner";
import { scrollToBottom } from "@/lib/scroll.utils";
import { DisplayField } from "../DisplayField";

export const CampaignSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  latestCampaignIndex: number;
  selectedCampaignIndex: number;
  setSelectedCampaignIndex: React.Dispatch<React.SetStateAction<number>>;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}> = ({
  campaignInformation,
  latestCampaignIndex,
  selectedCampaignIndex,
  setSelectedCampaignIndex,
  expandedSections,
  setExpandedSections,
}) => {
  const [showDynamicData, setShowDynamicData] = React.useState(false);

  const isCampaignExpanded = expandedSections["campaignInformation"] ?? true;

  const [isPlaceholderExpanded, setIsPlaceholderExpanded] = useState(true);
  const [isMoodboardPlaceholderExpanded, setIsMoodboardPlaceholderExpanded] =
    useState(true);
  const {
    selectedBrandId,
    isCreatingBrand,
    isCampaignCreating,
    setIsCampaignCreating,
  } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  const [fadeKey, setFadeKey] = useState(0);

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  // Create a ref for the CampaignOverview component
  const campaignOverviewRef = React.useRef<HTMLDivElement>(null);

  // Function to scroll to CampaignOverview
  const scrollToCampaignOverview = () => {
    if (campaignOverviewRef.current) {
      campaignOverviewRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // All useEffect hooks
  useEffect(() => {
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(latestCampaignIndex);

    // Ensure the campaign section stays expanded when new campaign is created
    setExpandedSections((prev) => ({
      ...prev,
      campaignInformation: true,
    }));
  }, [latestCampaignIndex, setExpandedSections]);

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
            currentBrandContextId: selectedBrandId,
          });
        }

        // Use the reusable scroll utility
        scrollToBottom(100);
      } catch (error) {
        console.error("Error creating new campaign:", error);
      }
    },
    [user, stream, selectedBrandId, setIsCampaignCreating]
  );

  const handleCampaignIndexChange = useCallback((index: number) => {
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(index);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpandedSections((prev) => ({
      ...prev,
      campaignInformation: !prev.campaignInformation,
    }));
  }, []);

  const handleMoodboardPlaceholderClick = () => {
    toast.info("Please create a campaign before creating a moodboard.");
  };

  const handleFieldUpdate = (
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
        currentBrandContextId: selectedBrandId,
      });
    }
  };

  if (
    !campaignInformation ||
    campaignInformation.length === 0 ||
    isCreatingBrand ||
    isCampaignCreating
  ) {
    return (
      <>
        <PlaceholderSection
          title={isCampaignCreating ? "Creating Campaign..." : "Campaign"}
          avatarFallback="C"
          avatarBgColor="bg-green-500"
          fields={campaignFields}
          searchPlaceholder="Select Campaign"
          newButtonTooltip="New Campaign"
          isExpanded={isPlaceholderExpanded}
          onToggleExpanded={() =>
            setIsPlaceholderExpanded((prev: boolean) => !prev)
          }
          onNewClick={handleViaAgent}
          isCreatingNewCampaign={isCampaignCreating}
        />
        <PlaceholderSection
          title={"Moodboard"}
          avatarFallback="M"
          avatarBgColor="bg-orange-400"
          fields={moodboardFields}
          searchPlaceholder="Select Moodboard"
          newButtonTooltip="New Moodboard"
          isExpanded={isMoodboardPlaceholderExpanded}
          onToggleExpanded={() =>
            setIsMoodboardPlaceholderExpanded((prev: boolean) => !prev)
          }
          onNewClick={handleMoodboardPlaceholderClick}
          isCreatingNewCampaign={isCampaignCreating}
        />
      </>
    );
  }

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            {isCampaignExpanded ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            {!isCampaignExpanded ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MegaphoneIcon size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div>
                    <div className="text-sm font-semibold break-words max-w-xs">
                      {currentCampaign?.campaign?.title}
                    </div>
                    <div>
                      <div className="absolute right-3 top-7 flex ">
                        <div className="flex justify-between items-center gap-x-2">
                          {campaignInformation && (
                            <CampaignSelector
                              campaigns={campaignInformation}
                              selectedCampaignIndex={selectedCampaignIndex}
                              setSelectedCampaignIndex={
                                handleCampaignIndexChange
                              }
                            />
                          )}

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
                    </div>
                  </div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your brand campaigns
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MegaphoneIcon size={24} />
                  </span>
                </div>
                <div>
                  <DisplayField
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
                  />
                </div>
              </div>
            )}
          </div>
          {isCampaignExpanded && (
            <div className="absolute right-3 top-7">
              <div className="flex justify-between items-center gap-x-2">
                {campaignInformation && (
                  <CampaignSelector
                    campaigns={campaignInformation}
                    selectedCampaignIndex={selectedCampaignIndex}
                    setSelectedCampaignIndex={handleCampaignIndexChange}
                  />
                )}

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
          )}
        </div>
      </CardHeader>

      {isCampaignExpanded && (
        <div>
          <CardContent>
            {/* Existing campaign content */}
            {currentCampaign && (
              <motion.div
                key={fadeKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="pt-0 pb-6"
              >
                <div className="mt-1 space-y-6">
                  <>
                    <div ref={campaignOverviewRef}>
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
                    </div>
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

                    <AnimatePresence>
                      {showDynamicData && (
                        <motion.div
                          key="dynamic-section"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="space-y-6"
                          transition={{ duration: 0.1 }}
                          variants={{
                            hidden: { opacity: 0, y: 5 },
                            visible: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 5 },
                          }}
                        >
                          {Object.keys(currentCampaign.dynamic || {}).length ===
                            0 && (
                            <div className="text-sm italic text-gray-400">
                              No dynamic details available.
                            </div>
                          )}

                          {Object.keys(currentCampaign.dynamic || {}).map(
                            (key) => (
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
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                </div>
              </motion.div>
            )}

            <Button
              onClick={() => {
                setShowDynamicData(!showDynamicData);
                // Scroll to CampaignOverview when hiding dynamic data
                if (showDynamicData) {
                  scrollToCampaignOverview();
                }
              }}
              className="text-primary underline  cursor-pointer h-max w-max hover:bg-transparent p-0 flex ml-auto"
              variant="ghost"
            >
              {showDynamicData ? <ChevronUp /> : <ChevronDown />}
              {showDynamicData ? " Less details" : "More details"}
            </Button>
          </CardContent>
        </div>
      )}
    </Card>
  );
};
