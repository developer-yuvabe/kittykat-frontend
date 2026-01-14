"use client";

import { useBrandUpdatesStore } from "@/store/brand-updates.store";
import { useBrandStore } from "@/store/brand.store";
import { useQueryState } from "nuqs";
import React, { useCallback, useEffect, useMemo } from "react";
import A2iImagesSection from "./a2i/A2iImagesSection";
import { BrandSection } from "./brands/BrandSection";
import { CampaignSection } from "./campaigns/CampaignSection";
import { MoodboardSection } from "./moodboards/MoodboardSection";
import { useUserStore } from "@/store/user.store";
import SectionWrapper, {
  SectionWrapperSkeleton,
} from "../shared/SectionWrapper";
import {
  brandFields,
  campaignFields,
  moodboardFields,
  PlaceholderSection,
} from "./brands/InitialPlaceHolder";
import { AppConfig } from "@/config/app.config";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";
import { useThreadStore } from "@/store/thread.store";
import { useStreamContext } from "@/providers/langgraph/Stream";

interface BrandDetailsPanelProps {
  isLargeScreen: boolean;
}

const BrandDetailsPanel: React.FC<BrandDetailsPanelProps> = ({}) => {
  const {
    isBrandsFetched,
    isCreatingBrand,
    setIsCreatingBrand,
    selectedCampaignId: globalSelectedCamapaignId,
    setSelectedCampaignId,
    isCampaignCreating,
    setIsCampaignCreating,
    selectedBrandId,
    selectedMoodboardId,
    selectedCampaignId,
  } = useBrandStore();
  const { isSwitchingTeam } = useUserStore();
  const { isFetchingBrandInfo, data } = useBrandUpdatesStore();
  const [isPlaceholderExpanded, setIsPlaceholderExpanded] = React.useState({
    brand: AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW,
    campaign: AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW,
    moodboard: AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW,
  });
  const { user } = useUserStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const { chatOnlyMode } = useThreadStore();
  const stream = useStreamContext();

  const brandingInformation = data?.brand_information;
  const campaignInformation = data?.campaign_information?.filter(
    (campaign) => campaign.is_custom !== true
  );
  const a2iImageInformation = data?.a2i_image_information;
  const moodboardInformation = data?.moodboard_information;
  const moodboardTags = data?.moodboard_tags;

  const [selectedCampaignIdFromUrl] = useQueryState("campaignId");
  const currentCampaign = useMemo(() => {
    if (!campaignInformation || campaignInformation.length === 0) {
      return null;
    }

    // If there's a campaignId in the URL, try to find it in the list
    const campaign = campaignInformation.find(
      (c) =>
        c.id === selectedCampaignIdFromUrl || c.id === globalSelectedCamapaignId
    );

    if (campaign) return campaign;

    // If not found, return the latest campaign

    return campaignInformation[campaignInformation.length - 1];
  }, [
    campaignInformation,
    selectedCampaignIdFromUrl,
    globalSelectedCamapaignId,
  ]);

  // Enhanced function to handle new campaign creation with scroll
  const handleViaAgent = useCallback(
    async (type: "brand" | "campaign" | "mooodboard", e?: any) => {
      if (e) {
        e.stopPropagation();
      }

      try {
        const prompt = `Let's create a new ${type}!`;

        // Set creating campaign state
        if (type === "campaign") setIsCampaignCreating(true);
        if (type === "brand") {
          setIsCreatingBrand(true);
        }

        // Submit the message
        if (user) {
          submitOptimisticMessage({
            stream,
            text: prompt,
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

  useEffect(() => {
    if (currentCampaign) {
      setSelectedCampaignId(currentCampaign.id);
    }
  }, [currentCampaign]);

  const loadingState =
    isFetchingBrandInfo || isSwitchingTeam || !isBrandsFetched;

  const brandPlaceHolderState = !brandingInformation || isCreatingBrand;

  const campaignPlaceHolderState =
    !brandingInformation ||
    !campaignInformation ||
    campaignInformation.length === 0 ||
    isCreatingBrand ||
    isCampaignCreating;

  if (loadingState) {
    return <SectionWrapperSkeleton />;
  }

  return (
    <div className="pt-10">
      <SectionWrapper id="brand" className="border-t">
        {brandPlaceHolderState ? (
          <PlaceholderSection
            title={isCreatingBrand ? "Creating Brand..." : "Brand"}
            type="brand"
            fields={brandFields}
            searchPlaceholder="Select Brand"
            newButtonTooltip="New Brand"
            isExpanded={isPlaceholderExpanded.brand}
            onToggleExpanded={() =>
              setIsPlaceholderExpanded((prev) => ({
                ...prev,
                brand: !prev.brand,
              }))
            }
            onNewClick={(e: any) => handleViaAgent("brand", e)}
          />
        ) : (
          <BrandSection
            brandingInformation={brandingInformation}
            analysisLogs={data?.analysis_logs ?? []}
            personas={data?.personas ?? []}
            brandBrainAnalysis={data?.brand_brain_analysis}
          />
        )}
      </SectionWrapper>

      <SectionWrapper id="campaign">
        {campaignPlaceHolderState ? (
          <PlaceholderSection
            title={isCampaignCreating ? "Creating Campaign..." : "Campaign"}
            type="campaign"
            fields={campaignFields}
            searchPlaceholder="Select Campaign"
            newButtonTooltip="New Campaign"
            isExpanded={isPlaceholderExpanded.campaign}
            onToggleExpanded={() =>
              setIsPlaceholderExpanded((prev) => ({
                ...prev,
                campaign: !prev.campaign,
              }))
            }
            onNewClick={(e: any) => handleViaAgent("campaign", e)}
            isCreatingNewCampaign={isCampaignCreating}
          />
        ) : (
          <CampaignSection
            campaignInformation={campaignInformation}
            brandInformation={brandingInformation}
            currentCampaign={currentCampaign}
          />
        )}
      </SectionWrapper>

      <SectionWrapper id="moodboard">
        {campaignPlaceHolderState ? (
          <PlaceholderSection
            title={"Moodboard"}
            type="moodboard"
            fields={moodboardFields}
            searchPlaceholder="Select Moodboard"
            newButtonTooltip="New Moodboard"
            isExpanded={isPlaceholderExpanded.moodboard}
            onToggleExpanded={() =>
              setIsPlaceholderExpanded((prev) => ({
                ...prev,
                moodboard: !prev.moodboard,
              }))
            }
            onNewClick={(e: any) => handleViaAgent("mooodboard", e)}
            isCreatingNewCampaign={isCampaignCreating}
          />
        ) : (
          <MoodboardSection
            brandInformation={brandingInformation}
            campaignInformation={campaignInformation}
            currentCampaign={currentCampaign}
            moodboardInformation={moodboardInformation}
            moodboardTags={moodboardTags}
          />
        )}
      </SectionWrapper>

      {brandingInformation && !brandPlaceHolderState && (
        <SectionWrapper id="concept_visual_generator">
          <A2iImagesSection
            a2iImageInformation={a2iImageInformation}
            moodboardInformation={moodboardInformation}
            campaignInformation={campaignInformation}
            currentCampaign={currentCampaign}
          />
        </SectionWrapper>
      )}
    </div>
  );
};

export default BrandDetailsPanel;
