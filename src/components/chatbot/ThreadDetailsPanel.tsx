"use client";

import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";
import { useBrandStore } from "@/store/brand.store";
import React, { useEffect, useMemo, useState } from "react";
import A2iImagesSection from "./a2i/A2iImagesSection";
import { InitialPlaceHolder } from "./brands/InitialPlaceHolder";
import { BrandSection } from "./brands/BrandSection";
import { CampaignSection } from "./campaigns/CampaignSection";
import { MoodboardSection } from "./moodboards/MoodboardSection";
import { useQueryState } from "nuqs";

interface ThreadDetailsPanelProps {
  isLargeScreen: boolean;
}

const ThreadDetailsPanel: React.FC<ThreadDetailsPanelProps> = ({
  isLargeScreen,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true, campaignInformation: true });
  const { isBrandsFetched, isCreatingBrand, setSelectedCampaignId } =
    useBrandStore();
  const { isFetchingBrandInfo, data } = useBrandUpdates();

  const brandingInformation = data?.brand_information;
  const campaignInformation = data?.campaign_information?.filter(
    (campaign) => campaign.is_custom !== true
  );
  const a2iImageInformation = data?.a2i_image_information;
  const moodboardInformation = data?.moodboard_information;
  const moodboardTags = data?.moodboard_tags;

  const [selectedCampaignIdFromUrl] = useQueryState("campaignId");

  const activeCampaignIndex = useMemo(() => {
    if (!campaignInformation || campaignInformation.length === 0) return 0;

    // If there's a campaignId in the URL, try to find it in the list
    if (selectedCampaignIdFromUrl !== null) {
      const idx = campaignInformation.findIndex(
        (c) => c.id === selectedCampaignIdFromUrl
      );
      if (idx !== -1) return idx; // found campaign from URL
    }

    // fallback to latest campaign
    return campaignInformation.length - 1;
  }, [campaignInformation, selectedCampaignIdFromUrl]);
  const [selectedCampaignIndex, setSelectedCampaignIndex] =
    useState(activeCampaignIndex);

  const currentCampaignId = campaignInformation?.[selectedCampaignIndex]?.id;

  useEffect(() => {
    const updateCampaigns = async () => {
      if (currentCampaignId) {
        setSelectedCampaignId(currentCampaignId);
      }
    };
    updateCampaigns();
  }, [selectedCampaignIndex]);

  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col overflow-auto scrollbar ${
        isLargeScreen ? "w-full min-h-full h-full" : ""
      }`}
    >
      {isFetchingBrandInfo || isCreatingBrand ? (
        <InitialPlaceHolder
          isLoading={isFetchingBrandInfo || !isBrandsFetched}
          isCreatingNewBrand={isCreatingBrand}
        />
      ) : (
        <div className="relative">
          <BrandSection
            brandingInformation={brandingInformation}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            analysisLogs={data?.analysis_logs ?? []}
          />

          <CampaignSection
            campaignInformation={campaignInformation}
            brandInformation={brandingInformation}
            latestCampaignIndex={activeCampaignIndex}
            selectedCampaignIndex={selectedCampaignIndex}
            setSelectedCampaignIndex={setSelectedCampaignIndex}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
          />

          {!isCreatingBrand && campaignInformation && (
            <MoodboardSection
              brandInformation={brandingInformation}
              campaignInformation={campaignInformation}
              setSelectedCampaignIndex={setSelectedCampaignIndex}
              selectedCampaignIndex={selectedCampaignIndex}
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
          selectedCampaignIndex={selectedCampaignIndex}
        />
      )}
    </div>
  );
};

export default ThreadDetailsPanel;
