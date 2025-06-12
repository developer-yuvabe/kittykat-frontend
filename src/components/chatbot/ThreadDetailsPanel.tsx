"use client";

import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";
import { useThreads } from "@/providers/langgraph/Thread";
import { useBrandStore } from "@/store/brand.store";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import React from "react";
import A2iImagesSection from "./a2i/A2iImagesSection";
import {
  campaignFields,
  InitialPlaceHolder,
  PlaceholderSection,
} from "./brands/InitialPlaceHolder";
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
      className={`rounded-2xl bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
        isLargeScreen ? "w-full min-h-full h-full" : ""
      }`}
    >
      {threadsLoading || isFetchingBrandInfo || !isBrandsFetched ? (
        <InitialPlaceHolder isLoading />
      ) : (
        <div>
          <BrandSection
            brandingInformation={brandingInformation}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            clearPinnedItems={removePinnedItem}
          />

          {campaignInformation ? (
            <CampaignSection
              campaignInformation={campaignInformation}
              brandInformation={brandingInformation}
            />
          ) : (
            <PlaceholderSection
              title="Campaign"
              avatarFallback="C"
              avatarBgColor="bg-green-500"
              fields={campaignFields}
              searchPlaceholder="Load existing Campaign"
              newButtonTooltip="New Campaign"
              onNewClick={() => {
                console.log("New Campaign clicked");
              }}
              isExpanded={expandedSections["campaignSection"]}
              onToggleExpanded={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  campaignSection: !prev["campaignSection"],
                }))
              }
            />
          )}
          {brandingInformation && (
            <A2iImagesSection
              a2iImageInformation={a2iImageInformation}
              campaignInformation={campaignInformation}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadDetailsPanel;
