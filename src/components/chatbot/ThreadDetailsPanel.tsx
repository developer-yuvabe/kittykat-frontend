"use client";

import { useBrandUpdatesStore } from "@/store/brand-updates.store";
import { useBrandStore } from "@/store/brand.store";
import { useQueryState } from "nuqs";
import React, { useEffect, useMemo } from "react";
import A2iImagesSection from "./a2i/A2iImagesSection";
import { BrandSection } from "./brands/BrandSection";
import { InitialPlaceHolder } from "./brands/InitialPlaceHolder";
import { CampaignSection } from "./campaigns/CampaignSection";
import { MoodboardSection } from "./moodboards/MoodboardSection";
import { useUserStore } from "@/store/user.store";

interface ThreadDetailsPanelProps {
  isLargeScreen: boolean;
}

const ThreadDetailsPanel: React.FC<ThreadDetailsPanelProps> = ({
  isLargeScreen,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true, campaignInformation: true });
  const {
    isBrandsFetched,
    isCreatingBrand,
    selectedCampaignId: globalSelectedCamapaignId,
    setSelectedCampaignId,
  } = useBrandStore();
  const { isSwitchingTeam } = useUserStore();
  const { isFetchingBrandInfo, data } = useBrandUpdatesStore();

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

  useEffect(() => {
    if (currentCampaign) {
      setSelectedCampaignId(currentCampaign.id);
    }
  }, [currentCampaign]);

  return (
    <div
      className={`relative rounded-2xl px-8 pt-8  flex flex-col overflow-auto scrollbar ${
        isLargeScreen ? "w-full min-h-full h-full" : ""
      }`}
    >
      {isFetchingBrandInfo ||
      isCreatingBrand ||
      isSwitchingTeam ||
      !isBrandsFetched ? (
        <InitialPlaceHolder
          isLoading={isFetchingBrandInfo || !isBrandsFetched || isSwitchingTeam}
          isCreatingNewBrand={isCreatingBrand}
        />
      ) : (
        <div className="relative">
          <BrandSection
            brandingInformation={brandingInformation}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            analysisLogs={data?.analysis_logs ?? []}
            personas={data?.personas ?? []}
            brandBrainAnalysis={data?.brand_brain_analysis}
          />

          <CampaignSection
            campaignInformation={campaignInformation}
            brandInformation={brandingInformation}
            currentCampaign={currentCampaign}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
          />

          {!isCreatingBrand && campaignInformation && (
            <MoodboardSection
              brandInformation={brandingInformation}
              campaignInformation={campaignInformation}
              currentCampaign={currentCampaign}
              moodboardInformation={moodboardInformation}
              moodboardTags={moodboardTags}
            />
          )}
        </div>
      )}
      {brandingInformation && !isCreatingBrand && (
        <A2iImagesSection
          a2iImageInformation={a2iImageInformation}
          moodboardInformation={moodboardInformation}
          campaignInformation={campaignInformation}
          currentCampaign={currentCampaign}
        />
      )}
    </div>
  );
};

export default ThreadDetailsPanel;
