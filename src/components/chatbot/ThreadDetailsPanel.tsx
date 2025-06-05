import { useBrandUpdates } from "@/hooks/useBrandUpdates";
import { useThreads } from "@/providers/langgraph/Thread";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import React, { useEffect, useRef } from "react";
import { CardSkeleton } from "../thread/messages/message-skeleton";
import { CampaignSection } from "./campaigns/CampaignSection";
import { BrandSection } from "./brands/BrandSection";
import A2iImagesSection from "./a2i/A2iImagesSection";
import {
  campaignFields,
  PlaceholderSection,
} from "./brands/InitialPlaceHolder";

interface ThreadDetailsPanelProps {
  isLargeScreen: boolean;
  threadId: string | null;
  setThreadId: (id: string | null) => void;
}

const ThreadDetailsPanel: React.FC<ThreadDetailsPanelProps> = ({
  isLargeScreen,
  setThreadId,
  threadId,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true });
  const { threadsLoading, updateThreadName } = useThreads();
  const { removePinnedItem } = usePinnedContextStore();
  const { isFectchingThreadInfo, data } = useBrandUpdates(threadId);

  const brandingInformation = data?.brand_information;
  const campaignInformation = data?.campaign_information;
  const a2iImageInformation = data?.a2i_image_information;

  const previousBrandName = useRef<string>(null);

  useEffect(() => {
    const brandName = brandingInformation?.static?.brand?.name;

    if (brandName && threadId && previousBrandName.current !== brandName) {
      updateThreadName(threadId, brandName);
      previousBrandName.current = brandName;
    }
  }, [brandingInformation?.static?.brand?.name, threadId]);

  return (
    <div
      className={`w-full min-h-full h-full rounded-2xl bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      {threadsLoading || isFectchingThreadInfo ? (
        <CardSkeleton />
      ) : (
        <>
          {
            <BrandSection
              brandingInformation={brandingInformation}
              setThreadId={setThreadId}
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              clearPinnedItems={removePinnedItem}
            />
          }
          {campaignInformation ? (
            <CampaignSection
              campaignInformation={campaignInformation}
              brandId={threadId!}
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

          {campaignInformation && campaignInformation?.length > 0 && (
            <A2iImagesSection
              a2iImageInformation={a2iImageInformation}
              brandId={threadId}
              campaignInformation={campaignInformation}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ThreadDetailsPanel;
