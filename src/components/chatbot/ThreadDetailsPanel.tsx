"use client";

import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";
import { useThreads } from "@/providers/langgraph/Thread";
import { useBrandStore } from "@/store/brand.store";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import React from "react";
import A2iImagesSection from "./a2i/A2iImagesSection";
import { InitialPlaceHolder } from "./brands/InitialPlaceHolder";
import { BrandSection } from "./brands/BrandSection";
import { CampaignSection } from "./campaigns/CampaignSection";
import { MoodboardSection } from "./moodboards/MoodboardSection";

interface ThreadDetailsPanelProps {
  isLargeScreen: boolean;
}

const ThreadDetailsPanel: React.FC<ThreadDetailsPanelProps> = ({
  isLargeScreen,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true });
  const { threadsLoading } = useThreads();
  const { removePinnedItem } = usePinnedContextStore();
  const { selectedBrandId, isBrandsFetched } = useBrandStore();
  const { isFetchingBrandInfo, data } = useBrandUpdates(selectedBrandId);

  const brandingInformation = data?.brand_information;
  const campaignInformation = data?.campaign_information;
  const a2iImageInformation = data?.a2i_image_information;
  const moodboardInformation = data?.moodboard_information;

  const latestCampaignIndex = useMemo(
    () =>
      campaignInformation && campaignInformation.length > 0
        ? campaignInformation.length - 1
        : 0,
    [campaignInformation]
  );

  const [selectedCampaignIndex, setSelectedCampaignIndex] =
    useState(latestCampaignIndex);

  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col overflow-auto scrollbar ${
        isLargeScreen ? "w-full min-h-full h-full" : ""
      }`}
    >
      {threadsLoading || isFetchingBrandInfo || !isBrandsFetched ? (
        <InitialPlaceHolder isLoading />
      ) : (
        <div className="relative">
          <BrandSection
            brandingInformation={brandingInformation}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            clearPinnedItems={removePinnedItem}
          />

          <CampaignSection
            campaignInformation={campaignInformation}
            brandInformation={brandingInformation}
            latestCampaignIndex={latestCampaignIndex}
            selectedCampaignIndex={selectedCampaignIndex}
            setSelectedCampaignIndex={setSelectedCampaignIndex}
          />

          <MoodboardSection
            brandInformation={brandingInformation}
            campaignInformation={campaignInformation}
            setSelectedCampaignIndex={setSelectedCampaignIndex}
            selectedCampaignIndex={selectedCampaignIndex}
            moodboardInformation={moodboardInformation}
          />
        </div>
      )}
      {brandingInformation && (
        <A2iImagesSection a2iImageInformation={a2iImageInformation} />
      )}
    </div>
  );
};

export default ThreadDetailsPanel;
