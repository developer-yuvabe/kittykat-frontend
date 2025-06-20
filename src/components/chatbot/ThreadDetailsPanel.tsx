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

  return (
    <div
      className={`relative rounded-2xl bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
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
