import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToolMessage } from "@langchain/langgraph-sdk";
import BrandSelector, { renderBrandData } from "./BrandSection";
import { useThreads } from "@/providers/Thread";
import { CardSkeleton } from "../thread/messages/message-skeleton";
import { useStreamContext } from "@/providers/Stream";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";

interface ToolResultsPanelProps {
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  toolMessages: ToolMessage[];
  threadId: string | null;
  setThreadId: (id: string | null) => void;
}

const ToolResultsPanel: React.FC<ToolResultsPanelProps> = ({
  isLargeScreen,
  chatHistoryOpen,
  setChatHistoryOpen,
  toolMessages,
  setThreadId,
  threadId,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({});

  const { threadsLoading } = useThreads();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const stream = useStreamContext();
  const brandingInformation =
    stream?.values?.sources?.brandingInformation ?? null;
  const hasBrandData =
    brandingInformation && Object.keys(brandingInformation).length > 0;

  const { updateThreadName } = useThreads();
  const { clearPinnedItems } = usePinnedContextStore();

  useEffect(() => {
    if (brandingInformation?.static?.brand?.name) {
      if (threadId) {
        updateThreadName(threadId, brandingInformation?.static?.brand?.name);
      } else {
        console.error("Thread ID is null. Cannot update thread name.");
      }
    }
  }, [brandingInformation]);

  return (
    <div
      className={`w-2/3 rounded-2xl mx-4  bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      <div className="flex-1">
        {threadsLoading ? (
          // Show skeleton when threads are loading
          <CardSkeleton />
        ) : hasBrandData ? (
          <div className="flex flex-col gap-4">
            <div key={`brand-message-${brandingInformation.static.name}`}>
              {renderBrandData(
                expandedSections,
                toggleSection,
                setThreadId,
                brandingInformation.static,
                brandingInformation.dynamic,
                clearPinnedItems
              )}
            </div>
          </div>
        ) : (
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
                  No brand information is currently available. Start chatting
                  with the{" "}
                  <span className="font-semibold text-primary">
                    Kittykat agent
                  </span>{" "}
                  to onboard your brand.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolResultsPanel;
