import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BrandSelector, { renderBrandData } from "./BrandSection";
import { useThreads } from "@/providers/langgraph/Thread";
import { CardSkeleton } from "../thread/messages/message-skeleton";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { CampaignSection } from "./CampaignSection";
import _ from "lodash";
interface ToolResultsPanelProps {
  isLargeScreen: boolean;
  threadId: string | null;
  setThreadId: (id: string | null) => void;
}

const BrandSection: React.FC<{
  brandingInformation: any;
  setThreadId: (id: string | null) => void;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  clearPinnedItems: () => void;
}> = ({
  brandingInformation,
  setThreadId,
  expandedSections,
  setExpandedSections,
  clearPinnedItems,
}) => {
  if (!brandingInformation)
    return (
      <div className="p-4">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">
              <div className="flex justify-between">
                <div>No brand found</div>
                <BrandSelector setThreadId={setThreadId} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No brand information is currently available. Start chatting with
              the{" "}
              <span className="font-semibold text-primary">Kittykat agent</span>{" "}
              to onboard your brand.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <div key={`brand-message-${brandingInformation?.static?.name}`}>
        {renderBrandData(
          expandedSections,
          (section) =>
            setExpandedSections((prev) => ({
              ...prev,
              [section]: !prev[section],
            })),
          setThreadId,
          brandingInformation.static,
          brandingInformation.dynamic,
          clearPinnedItems
        )}
      </div>
    </div>
  );
};

const ToolResultsPanel: React.FC<ToolResultsPanelProps> = ({
  isLargeScreen,
  setThreadId,
  threadId,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true });
  const { threadsLoading, updateThreadName } = useThreads();
  const { clearPinnedItems } = usePinnedContextStore();
  const stream = useStreamContext();

  const brandingInformation = _.isEmpty(
    stream?.values?.sources?.brandingInformation
  )
    ? null
    : stream?.values?.sources?.brandingInformation;
  const campaignInfo = stream?.values?.sources?.campaigns ?? [];
  const previousBrandName = useRef(null);
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
        {threadsLoading ? (
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

export default ToolResultsPanel;
