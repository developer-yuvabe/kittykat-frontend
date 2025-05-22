import { useBrandUpdates } from "@/hooks/useBrandUpdates";
import { useThreads } from "@/providers/langgraph/Thread";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import React, { useEffect, useRef } from "react";
import { CardSkeleton } from "../thread/messages/message-skeleton";
import { CampaignSection } from "./CampaignSection";
import { BrandSection } from "./brands/BrandSection";

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
  const { clearPinnedItems } = usePinnedContextStore();
  const { isFectchingThreadInfo, data } = useBrandUpdates(threadId);

  const brandingInformation = data?.brand_information;
  const campaignInfo: unknown[] = [];
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
      className={`w-2/3 rounded-2xl mx-4 bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      <div className="flex-1">
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
                clearPinnedItems={clearPinnedItems}
              />
            }
            {brandingInformation && (
              <CampaignSection campaignInfo={campaignInfo} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ThreadDetailsPanel;
