import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, ChevronUp, CirclePlus } from "lucide-react";
import { MdOutlineCampaign } from "react-icons/md";
import { DynamicContentSection } from "../DynamicSection";
import { Agents, ThreadDetails } from "@/types/types";
import { CampaignColors } from "./CampaignColors";
import { CampaignOverview } from "./CampaignOverview";
import CampaignSelector from "./CampaignSelector";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { AnimatePresence, motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  campaignFields,
  PlaceholderSection,
} from "../brands/InitialPlaceHolder";
import { Button } from "@/components/ui/button";

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
  const {
    selectedBrandId,
    isCreatingBrand,
    isCampaignCreating,
    setIsCampaignCreating,
  } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  console.log(campaignInformation);

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

  const handleViaAgent = useCallback(() => {
    setIsCampaignCreating(true);
    if (user) {
      submitOptimisticMessage({
        stream,
        text: `Let's create a new campaign!`,
        userId: user.id,
        currentBrandContextId: selectedBrandId,
      });
    }
  }, [user, stream, selectedBrandId]);

  const handleCampaignIndexChange = useCallback((index: number) => {
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(index);
  }, []);

  const handleTitleSave = useCallback(
    async (newVal: string) => {
      const oldVal = currentCampaign?.campaign?.title || "Unnamed Campaign";
      const msg = formatUpdateMessage(
        "campaign.title",
        oldVal,
        newVal,
        "campaignAgent",
        "Campaign Title"
      );
      if (msg && user) {
        submitOptimisticMessage({
          stream,
          text: msg,
          userId: user.id,
          currentBrandContextId: selectedBrandId,
        });
      }
    },
    [currentCampaign, user, selectedBrandId]
  );

  const toggleExpanded = useCallback(() => {
    setExpandedSections((prev) => ({
      ...prev,
      campaignInformation: !prev.campaignInformation,
    }));
  }, []);

  if (
    !campaignInformation ||
    campaignInformation.length === 0 ||
    isCreatingBrand ||
    isCampaignCreating
  ) {
    return (
      <PlaceholderSection
        title={isCampaignCreating ? "Creating Campaign..." : "Campaign"}
        avatarFallback="C"
        avatarBgColor="bg-green-500"
        fields={campaignFields}
        searchPlaceholder="Load existing Campaign"
        newButtonTooltip="New Campaign"
        isExpanded={isPlaceholderExpanded}
        onToggleExpanded={() =>
          setIsPlaceholderExpanded((prev: boolean) => !prev)
        }
        onNewClick={handleViaAgent}
        isCreatingNewCampaign={isCampaignCreating}
      />
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
                    <MdOutlineCampaign size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Campaigns</div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your brand campaigns
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MdOutlineCampaign size={24} />
                  </span>
                </div>
                <div>
                  <InlineEditableField
                    key={currentCampaign?.campaign?.title}
                    label="Campaign"
                    value={
                      currentCampaign?.campaign?.title || "Unnamed Campaign"
                    }
                    onSave={handleTitleSave}
                    textClassName="font-bold"
                    showLabel={true}
                    isTextarea={false}
                  />
                </div>
              </div>
            )}
          </div>
          {isCampaignExpanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              {campaignInformation && (
                <CampaignSelector
                  campaigns={campaignInformation}
                  selectedCampaignIndex={selectedCampaignIndex}
                  setSelectedCampaignIndex={handleCampaignIndexChange}
                />
              )}

              <Button
                size="lg"
                className="p-4"
                variant="ghost"
                onClick={handleViaAgent}
              >
                <CirclePlus className="size-5" />
              </Button>
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
                      <CampaignOverview
                        title={currentCampaign?.campaign?.title}
                        description={currentCampaign?.campaign?.description}
                        tone={currentCampaign?.campaign?.tone}
                        campaignId={currentCampaign.id}
                      />
                    </div>
                    <CampaignColors
                      colors={currentCampaign?.colors || []}
                      campaignId={currentCampaign.id}
                      campaignTitle={currentCampaign.campaign?.title}
                    />
                    <DynamicContentSection
                      dynamicData={{
                        "Target Audience": currentCampaign.target_audience,
                      }}
                      agentId={Agents.CAMPAIGN_AGENT}
                    />
                    <DynamicContentSection
                      dynamicData={{
                        "Content Campaign Ideas":
                          currentCampaign.content_campaign_ideas,
                      }}
                      agentId={Agents.CAMPAIGN_AGENT}
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
                          <DynamicContentSection
                            dynamicData={currentCampaign.dynamic ?? {}}
                            agentId={Agents.CAMPAIGN_AGENT}
                          />
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
