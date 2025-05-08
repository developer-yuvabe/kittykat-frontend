import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PanelRightOpen,
  PanelRightClose,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolResult } from "../thread/messages/tool-calls";
import { ToolMessage } from "@langchain/langgraph-sdk";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "../shared/ContentSection";

interface ToolResultsPanelProps {
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  toolMessages: ToolMessage[];
}

const ToolResultsPanel: React.FC<ToolResultsPanelProps> = ({
  isLargeScreen,
  chatHistoryOpen,
  setChatHistoryOpen,
  toolMessages,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const capitalizeKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check if we have brand data
  const brandMessages = toolMessages.filter(
    (message) => message.name === "scrape-brand"
  );

  const hasBrandData = brandMessages.length > 0;

  // Function to render content based on data type
  const renderContentByType = (data: any) => {
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc ml-4 text-sm">
          {data.map((item, index) => (
            <li key={index}>
              {typeof item === "object" && item !== null
                ? renderContentByType(item)
                : String(item)}
            </li>
          ))}
        </ul>
      );
    } else if (typeof data === "object" && data !== null) {
      return (
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <p className="text-sm font-medium">{capitalizeKey(key)}</p>
              <div className="ml-2">{renderContentByType(value)}</div>
            </div>
          ))}
        </div>
      );
    } else if (
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
      return <p className="text-sm text-[#323842]">{String(data)}</p>;
    }

    return <p className="text-sm text-gray-400">No data available</p>;
  };

  // Function to render value badges if array of strings
  const renderValueBadges = (data: any) => {
    if (Array.isArray(data) && data.every((item) => typeof item === "string")) {
      return (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.slice(0, 5).map((value: string, index: number) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-[#f5f2fd] text-[#7f55e0] border-[#f5f2fd]"
            >
              {value}
            </Badge>
          ))}
        </div>
      );
    }
    return null;
  };

  // Function to render each section of brand data
  const renderBrandSection = (key: string, data: any) => {
    const title = capitalizeKey(key);
    let content: React.ReactNode;

    // Check if the value has badges to display (for arrays of strings)
    const valueBadges = renderValueBadges(data);

    if (valueBadges) {
      content = valueBadges;
    } else if (typeof data === "object" && data !== null) {
      content = renderContentByType(data);
    } else {
      content = <p className="text-sm text-[#323842]">{String(data)}</p>;
    }

    return <ContentSection key={key} title={title} content={content} />;
  };

  // Function to render brand data
  const renderBrandData = (message: ToolMessage) => {
    try {
      let brandData;

      if (typeof message.content === "string") {
        brandData = JSON.parse(message.content);
      } else if (typeof message.content === "object") {
        brandData = message.content;
      } else {
        return (
          <p className="text-sm text-red-500">Invalid brand data format</p>
        );
      }
      const brandName = brandData?.brand?.name || "No Brand Name";
      const brandInitial = brandName.charAt(0).toUpperCase();

      return (
        <Card className="bg-white rounded-2xl shadow-sm mb-4">
          <CardHeader className="py-1">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection("brandOverview")}
            >
              <div className="flex items-center">
                {expandedSections.brandOverview ? (
                  <ChevronDown className="text-[#6e7787] mr-2" size={20} />
                ) : (
                  <ChevronRight className="text-[#6e7787] mr-2" size={20} />
                )}
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">{brandInitial}</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">
                    {brandData?.brand?.name
                      ? `Brand: ${brandData?.brand?.name}`
                      : "Brand Information"}
                  </div>
                  <div className="text-xs text-[#6e7787]">
                    Set-Up, switch and modify your Brand
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          {expandedSections.brandOverview && (
            <CardContent className="pt-0">
              <div className="mt-4 space-y-4">
                {Object.entries(brandData).map(([key, value]) =>
                  renderBrandSection(key, value)
                )}
              </div>
            </CardContent>
          )}
        </Card>
      );
    } catch (error) {
      console.error("Error parsing brand data:", error);
      return (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Error parsing brand data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">
              There was an error displaying the brand information.
            </p>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div
      className={`w-2/3 rounded-2xl mx-4 mb-4 bg-[#f3f4f6] p-8 flex flex-col overflow-hidden ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      <div className="absolute left-5 top-3 z-10">
        {(!chatHistoryOpen || !isLargeScreen) && (
          <Button
            className="hover:bg-gray-100"
            variant="ghost"
            onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 ml-4">
        {hasBrandData ? (
          <div className="flex flex-col gap-4">
            {brandMessages.map((message, index) => (
              <div key={`brand-${message.id || index}`}>
                {renderBrandData(message)}
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
                  No brand found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  No brand information is currently available.
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
