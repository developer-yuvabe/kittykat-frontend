import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolResult } from "../thread/messages/tool-calls";
import { ToolMessage } from "@langchain/langgraph-sdk";
import BrandSelector, { renderBrandData } from "./BrandSection";
import { useThreads } from "@/providers/Thread";
import { CardSkeleton } from "../thread/messages/message-skeleton";

interface ToolResultsPanelProps {
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  toolMessages: ToolMessage[];
  setThreadId: (id: string | null) => void;
}

const ToolResultsPanel: React.FC<ToolResultsPanelProps> = ({
  isLargeScreen,
  chatHistoryOpen,
  setChatHistoryOpen,
  toolMessages,
  setThreadId,
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

  // Check if we have brand data
  const brandMessages = toolMessages.filter(
    (message) => message.name === "scrape-brand"
  );

  const hasBrandData = brandMessages.length > 0;

  return (
    <div
      className={`w-2/3 rounded-2xl mx-4  bg-[#f3f4f6] p-8 flex flex-col overflow-hidden ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4 ml-4">
        {threadsLoading ? (
          // Show skeleton when threads are loading
          <CardSkeleton />
        ) : hasBrandData ? (
          <div className="flex flex-col gap-4">
            {brandMessages.map((message, index) => (
              <div key={`brand-${message.id || index}`}>
                {renderBrandData(
                  message,
                  expandedSections,
                  toggleSection,
                  setThreadId
                )}
              </div>
            ))}

            {/* Other tool results that aren't brand-related */}
            {toolMessages
              .filter((message) => message.name !== "scrape-brand")
              .map((message, index) => (
                <ToolResult
                  key={`tool-${message.id || index}`}
                  message={message}
                />
              ))}
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
